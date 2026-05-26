import { AIRouterConfig } from './types';
import { createClient } from '../supabase/server';

// Default configuration for MVP/Testing phase (Prioritize Free Models)
const DEFAULT_CONFIG: AIRouterConfig = {
  defaultLightweightProvider: 'groq',
  defaultPremiumProvider: 'openrouter',
  fallbackEnabled: true,
  preferredModels: {
    'openrouter': 'google/gemini-2.0-flash-lite-preview-02-05:free',
    'groq': 'llama-3.3-70b-versatile', // Groq's high-perf model (usually free tier available)
    'ollama': 'llama3',
    'openai': 'gpt-4o-mini' // Lowest cost premium fallback
  }
};

/**
 * Fetches the AI Router configuration from Supabase.
 * Falls back to DEFAULT_CONFIG if no database entry is found or on error.
 */
export async function getAIRouterConfig(): Promise<AIRouterConfig> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'router_config')
      .single();

    if (error || !data) {
      return DEFAULT_CONFIG;
    }

    return data.value as AIRouterConfig;
  } catch (err) {
    console.error('Failed to fetch AI config from DB:', err);
    return DEFAULT_CONFIG;
  }
}
