import { createAdminClient, createClient } from "@/lib/supabase/server";
import { aiRouter } from "./router";

export interface KnowledgeResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function searchKnowledge(
  query: string, 
  orgId: string, 
  limit: number = 5
): Promise<KnowledgeResult[]> {
  const supabase = await createClient();
  
  // 1. Generate embedding for query
  const embeddingResponse = await aiRouter.generateEmbedding(query);
  const embedding = embeddingResponse.embedding;

  // 2. Call Supabase RPC for vector search
  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: limit,
    target_org_id: orgId,
  });

  if (error) {
    console.warn("[VECTOR] Search failed (AI Insights unavailable):", error.message);
    return [];
  }

  return (data ?? []) as KnowledgeResult[];
}

export async function ingestKnowledge(
  content: string,
  orgId: string,
  sourceType: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createAdminClient();
  
  // 1. Generate embedding
  const embeddingResponse = await aiRouter.generateEmbedding(content);
  
  // 2. Insert into table
  const { error } = await supabase.from("knowledge_chunks").insert({
    organization_id: orgId,
    content,
    source_type: sourceType,
    metadata,
    embedding: embeddingResponse.embedding,
  });

  if (error) {
    throw new Error(`Knowledge ingestion failed: ${error.message}`);
  }
}
