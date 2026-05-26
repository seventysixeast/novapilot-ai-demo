export type AITaskCategory = 'LIGHTWEIGHT' | 'PREMIUM';

export type AIResponse = {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
  confidence?: number;
  isFallback?: boolean;
};

export interface AIProvider {
  name: string;
  generateCompletion(prompt: string, model?: string): Promise<AIResponse>;
  generateStream?(prompt: string, model?: string): Promise<ReadableStream>;
}

export type AIRouterConfig = {
  defaultLightweightProvider: string;
  defaultPremiumProvider: string;
  fallbackEnabled: boolean;
  preferredModels: Record<string, string>;
};

export class AIError extends Error {
  constructor(
    public message: string,
    public provider: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}
