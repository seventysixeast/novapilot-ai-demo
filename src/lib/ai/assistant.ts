import { aiRouter } from './router';

/**
 * Higher-level AI assistance functions that default to lightweight models
 * to optimize for cost and speed.
 */

export async function generateTooltip(context: string) {
  return aiRouter.generateCompletion(
    `Generate a helpful, concise tooltip for the following UI element context: ${context}. Keep it under 15 words.`,
    'LIGHTWEIGHT'
  );
}

export async function generateShortSummary(text: string) {
  return aiRouter.generateCompletion(
    `Summarize the following text in one sentence for a dashboard overview: ${text}`,
    'LIGHTWEIGHT'
  );
}

export async function suggestNextAction(userContext: string) {
  return aiRouter.generateCompletion(
    `Based on the user's current state: ${userContext}, suggest one clear next action to improve their growth metrics.`,
    'LIGHTWEIGHT'
  );
}

export async function generateChartLabel(dataDescription: string) {
  return aiRouter.generateCompletion(
    `Generate a professional 2-3 word label for a chart displaying: ${dataDescription}`,
    'LIGHTWEIGHT'
  );
}

export async function generateNotificationText(event: string) {
  return aiRouter.generateCompletion(
    `Generate a friendly but professional notification message for this event: ${event}. Keep it short.`,
    'LIGHTWEIGHT'
  );
}
