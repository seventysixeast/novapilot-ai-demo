// Simple in-memory cache with TTL to store responses for repetitive questions
// This avoids calling AI models repeatedly and gives instant answers.

const IN_MEMORY_CACHE = new Map<string, { answer: string; expiresAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(organizationId: string, queryText: string): string {
  const cleanQuery = queryText.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${organizationId}:${cleanQuery}`;
}

export async function getQuestionCache(
  organizationId: string,
  queryText: string,
  adminClient: any
): Promise<string | null> {
  const cacheKey = getCacheKey(organizationId, queryText);
  const now = Date.now();

  // 1. Check in-memory cache
  const cached = IN_MEMORY_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    console.log(`[CACHE] In-memory cache hit for query: "${queryText.trim()}"`);
    return cached.answer;
  }

  // 2. Fallback to Supabase ai_queries table
  // Retrieve the most recent fresh answer for the exact same query in the same organization (within the last 24 hours)
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const cleanQuery = queryText.trim();
    
    const { data, error } = await adminClient
      .from("ai_queries")
      .select("answer_text")
      .eq("organization_id", organizationId)
      .ilike("query_text", cleanQuery)
      .eq("freshness_status", "fresh")
      .gt("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[CACHE] Supabase query error:", error);
      return null;
    }

    if (data?.answer_text) {
      console.log(`[CACHE] Database cache hit for query: "${cleanQuery}"`);
      // Update in-memory cache
      IN_MEMORY_CACHE.set(cacheKey, {
        answer: data.answer_text,
        expiresAt: now + CACHE_TTL,
      });
      return data.answer_text;
    }
  } catch (err) {
    console.error("[CACHE] Failed to check database cache:", err);
  }

  return null;
}

export function setQuestionCache(
  organizationId: string,
  queryText: string,
  answer: string
): void {
  const cacheKey = getCacheKey(organizationId, queryText);
  IN_MEMORY_CACHE.set(cacheKey, {
    answer,
    expiresAt: Date.now() + CACHE_TTL,
  });
  console.log(`[CACHE] In-memory cache set for query: "${queryText.trim()}"`);
}
