import { AIProvider, AIResponse, AIError } from '../types';
import { env } from '@/lib/env';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = env.OPENAI_API_KEY || '';
  }

  async generateCompletion(prompt: string, model = 'gpt-4o-mini'): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new AIError('OPENAI_API_KEY is missing', this.name);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new AIError(`OpenAI failure: ${text}`, this.name, response.status);
      }

      const data = await response.json();
      return {
        text: data.choices[0]?.message?.content ?? 'No response text returned.',
        usage: {
          inputTokens: data.usage?.prompt_tokens ?? 0,
          outputTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        provider: this.name,
        model,
      };
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw new AIError(err instanceof Error ? err.message : 'Unknown error', this.name);
    }
  }

  async generateEmbedding(text: string) {
    if (!this.apiKey) {
      throw new AIError('OPENAI_API_KEY is missing', this.name);
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AIError(`OpenAI embedding failed: ${error}`, this.name, response.status);
    }

    const data = await response.json();
    return {
      embedding: data.data[0]?.embedding ?? [],
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  }

  async generateStream(prompt: string, model = 'gpt-4o-mini'): Promise<ReadableStream> {
    if (!this.apiKey) {
      throw new AIError('OPENAI_API_KEY is missing', this.name);
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AIError(`OpenAI streaming failure: ${error}`, this.name, response.status);
    }

    return response.body!;
  }
}
