import { AITaskCategory, AIResponse, AIProvider, AIError } from './types';
import { OpenAIProvider } from './providers/openai';
import { OpenRouterProvider } from './providers/openrouter';
import { GroqProvider } from './providers/groq';
import { OllamaProvider } from './providers/ollama';
import { MockProvider } from './providers/mock';
import { getAIRouterConfig } from './config';
import { env } from '@/lib/env';

type RouterProviderName = 'openai' | 'openrouter' | 'groq' | 'ollama' | 'mock';

class AIRouter {
  private providers: Record<string, AIProvider> = {};
  private inFlightRequests: Map<string, Promise<AIResponse>> = new Map();
  private cache: Map<string, { response: AIResponse; expires: number }> = new Map();
  private CACHE_TTL = 1000 * 60 * 5; // 5 minutes
  private DEFAULT_TIMEOUT = process.env.NODE_ENV === "production" ? 30000 : 2500; // 2.5s in dev
  private MAX_RETRIES = process.env.NODE_ENV === "production" ? 2 : 0; // No retries in dev

  constructor() {
    this.providers = {
      openai: new OpenAIProvider(),
      openrouter: new OpenRouterProvider(),
      groq: new GroqProvider(),
      ollama: new OllamaProvider(),
      mock: new MockProvider(),
    };
  }

  private isProviderConfigured(name: RouterProviderName): boolean {
    if (name === 'mock') return true;
    if (name === 'ollama') return true;
    if (name === 'openai') {
      return !!(env.OPENAI_API_KEY || process.env.OPENAI_API_KEY);
    }
    if (name === 'openrouter') {
      return !!(env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY);
    }
    if (name === 'groq') {
      return !!process.env.GROQ_API_KEY;
    }
    return false;
  }

  private resolveProviderName(candidate: string | undefined, fallback: string | undefined): RouterProviderName {
    const candidates = [candidate, fallback, env.DEFAULT_AI_PROVIDER, 'openai', 'mock'];
    const normalized = candidates.find(
      (name): name is RouterProviderName => 
        !!name && 
        name in this.providers && 
        this.isProviderConfigured(name as RouterProviderName)
    );

    return normalized || 'mock';
  }

  async generateCompletion(
    prompt: string,
    category: AITaskCategory = 'LIGHTWEIGHT',
    options: { forceProvider?: string; forceModel?: string; timeout?: number } = {}
  ): Promise<AIResponse> {
    const config = await getAIRouterConfig();
    const requestId = `${category}:${prompt}`;

    // 1. Check Cache
    const cached = this.cache.get(requestId);
    if (cached && cached.expires > Date.now()) {
      return cached.response;
    }

    // 2. Check in-flight requests
    if (this.inFlightRequests.has(requestId)) {
      return this.inFlightRequests.get(requestId)!;
    }

    const requestPromise = (async () => {
      // Priority: options > env > db config
      const routingPreference = category === 'PREMIUM' ? config.defaultPremiumProvider : config.defaultLightweightProvider;
      let providerName = this.resolveProviderName(options.forceProvider, routingPreference);
      
      if (!options.forceProvider && process.env.DEFAULT_AI_PROVIDER) {
        providerName = this.resolveProviderName(env.DEFAULT_AI_PROVIDER, routingPreference);
      }

      try {
        return await this.withRetry(() => this.withTimeout(
          async () => {
            let result = await this.callProvider(providerName, prompt, options.forceModel);
            
            // Quality check & Fallback
            if (config.fallbackEnabled && providerName !== 'openai') {
              const isWeak = result.text.length < 10 || result.text.includes("I don't know");
              if (isWeak) {
                console.warn(`[AI] Weak response from ${providerName}, falling back to OpenAI...`);
                result = await this.callProvider('openai', prompt);
                result.isFallback = true;
              }
            }
            return result;
          },
          options.timeout || this.DEFAULT_TIMEOUT
        ));
      } catch (error) {
        console.error(`[AI] Routing Failure [${providerName}]:`, error);
        
        // Secondary Fallback: OpenAI
        if (config.fallbackEnabled && providerName !== 'openai') {
          console.warn(`[AI] Attempting secondary fallback to OpenAI...`);
          try {
            const result = await this.callProvider('openai', prompt);
            result.isFallback = true;
            return result;
          } catch (fallbackError) {
            console.error('[AI] Secondary fallback to OpenAI failed:', fallbackError);
          }
        }
        
        // Ultimate Fallback: Mock Provider (Prevention of total crash)
        console.warn(`[AI] ALL PRIMARY PROVIDERS FAILED. Initializing Super Fallback to Mock Diagnostic Node...`);
        try {
          const mockResult = await this.callProvider('mock', prompt);
          mockResult.isFallback = true;
          return mockResult;
        } catch (mockError) {
          console.error('[AI] EVEN MOCK PROVIDER FAILED:', mockError);
        }
        
        throw error;
      }
    })();

    this.inFlightRequests.set(requestId, requestPromise);
    
    try {
      const response = await requestPromise;
      this.cache.set(requestId, {
        response,
        expires: Date.now() + this.CACHE_TTL
      });
      return response;
    } finally {
      this.inFlightRequests.delete(requestId);
    }
  }

  async generateStream(
    prompt: string,
    category: AITaskCategory = 'LIGHTWEIGHT',
    options: { forceProvider?: string; forceModel?: string } = {}
  ): Promise<ReadableStream> {
    try {
      const config = await getAIRouterConfig();
      const routingPreference = category === 'PREMIUM' ? config.defaultPremiumProvider : config.defaultLightweightProvider;
      const providerName = this.resolveProviderName(options.forceProvider, routingPreference);
      const provider = this.providers[providerName];

      const preferredModels = config.preferredModels as Record<string, string | undefined>;
      const model =
        options.forceModel ||
        (providerName === 'openai' ? env.DEFAULT_PREMIUM_MODEL : env.DEFAULT_LIGHTWEIGHT_MODEL) ||
        preferredModels[providerName] ||
        'mock-model';

      if (provider.generateStream) {
        return await provider.generateStream(prompt, model);
      }

      const completion = await provider.generateCompletion(prompt, model);
      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(completion.text));
          controller.close();
        },
      });
    } catch (error) {
      console.warn("[AI] Primary stream failed, falling back to mock stream:", error);
      const mockProvider = this.providers.mock;
      return await mockProvider.generateStream!(prompt, 'mock-model');
    }
  }

  private async callProvider(name: string, prompt: string, forceModel?: string): Promise<AIResponse> {
    const config = await getAIRouterConfig();
    const providerName = this.resolveProviderName(name, config.defaultLightweightProvider);
    const provider = this.providers[providerName];
    const preferredModels = config.preferredModels as Record<string, string | undefined>;
    const model =
      forceModel ||
      (providerName === 'openai' ? env.DEFAULT_PREMIUM_MODEL : env.DEFAULT_LIGHTWEIGHT_MODEL) ||
      preferredModels[providerName] ||
      'mock-model';
    
    return await provider.generateCompletion(prompt, model);
  }

  private async withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new AIError(`Request timed out after ${ms}ms`, 'router')), ms)
      ),
    ]);
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = this.MAX_RETRIES): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      // Only retry on transient-looking errors
      const isTransient = error instanceof AIError && (error.status === 429 || error.status === 500 || error.status === 503 || error.message.includes('timeout'));
      if (!isTransient) throw error;
      
      console.warn(`[AI] Retrying request... (${retries} left)`);
      return await this.withRetry(fn, retries - 1);
    }
  }

  async generateEmbedding(text: string) {
    try {
      const openai = this.providers.openai as OpenAIProvider;
      return await this.withTimeout(
        () => openai.generateEmbedding(text),
        process.env.NODE_ENV === "production" ? 10000 : 2000
      );
    } catch (error) {
      console.warn("[AI] Primary embedding failed, falling back to mock embedding:", error);
      const safeText = text || " ";
      const mockVector = new Array(1536).fill(0).map((_, i) => (safeText.charCodeAt(i % safeText.length) || 0) / 255);
      return { embedding: mockVector };
    }
  }
}

export const aiRouter = new AIRouter();
