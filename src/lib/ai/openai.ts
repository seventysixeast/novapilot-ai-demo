import { aiRouter } from './router';
import { AITaskCategory } from './types';

/**
 * Legacy wrapper for backward compatibility.
 * Now routes through the multi-model AI Router.
 */
export async function generateChatCompletion(input: string, category: AITaskCategory = 'PREMIUM') {
  const response = await aiRouter.generateCompletion(input, category);
  
  return {
    text: response.text,
    usage: {
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      totalTokens: response.usage.totalTokens,
    },
    provider: response.provider,
    model: response.model,
  };
}

/**
 * Generates embeddings using the router (which defaults to OpenAI).
 */
export async function generateEmbedding(text: string) {
  return await aiRouter.generateEmbedding(text);
}
