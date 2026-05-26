import { AIProvider, AIResponse, AIError } from '../types';
import { env } from '@/lib/env';

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    this.apiKey = env.OPENROUTER_API_KEY || '';
  }

  async generateCompletion(prompt: string, model = 'google/gemini-2.0-flash-lite-preview-02-05:free'): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new AIError('OPENROUTER_API_KEY is missing', this.name);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://novapilot.ai',
          'X-Title': 'NovaPilot AI',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new AIError(`OpenRouter failure: ${error}`, this.name, response.status);
      }

      const data = await response.json();
      return {
        text: data.choices[0]?.message?.content || '',
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        provider: this.name,
        model: data.model || model,
      };
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw new AIError(err instanceof Error ? err.message : 'Unknown error', this.name);
    }
  }

  async generateStream(prompt: string, model = 'google/gemini-2.0-flash-lite-preview-02-05:free'): Promise<ReadableStream> {
    if (!this.apiKey) {
      throw new AIError('OPENROUTER_API_KEY is missing', this.name);
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AIError(`OpenRouter streaming failure: ${error}`, this.name, response.status);
    }

    return response.body!;
  }
}
