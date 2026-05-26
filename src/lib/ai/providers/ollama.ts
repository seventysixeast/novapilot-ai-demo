import { AIProvider, AIResponse } from '../types';

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async generateCompletion(prompt: string, model = 'llama3'): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama failure: ${error}`);
    }

    const data = await response.json();
    return {
      text: data.message?.content || '',
      usage: {
        // Ollama usage fields might differ, mapping common ones
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      provider: this.name,
      model: data.model || model,
    };
  }
}
