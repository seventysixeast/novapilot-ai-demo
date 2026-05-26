"use server";

import { redirect } from "next/navigation";

import { generateEmbedding } from "@/lib/ai/openai";
import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";

export async function semanticSearch(formData: FormData) {
  const query = String(formData.get("query") ?? "").trim();
  if (!query) {
    redirect("/dashboard/search?error=Search query is required");
  }

  const membership = await getCurrentMembership();
  if (!membership) {
    redirect("/login");
  }

  if (!process.env.OPENAI_API_KEY) {
    redirect("/dashboard/search?error=OPENAI_API_KEY is missing");
  }

  try {
    const result = await generateEmbedding(query);
    const usage = "usage" in result ? result.usage : { promptTokens: 0, totalTokens: 0 };
    const supabase = await createClient();

    await supabase.from("ai_usage_logs").insert({
      organization_id: membership.organizationId,
      user_id: membership.userId,
      provider: "openai",
      model: "text-embedding-3-small",
      prompt_tokens: usage.promptTokens,
      completion_tokens: 0,
      metadata: {
        feature: "semantic_search",
      },
    });

    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: result.embedding,
      target_organization_id: membership.organizationId,
      match_count: 5,
    });

    if (error) {
      redirect(`/dashboard/search?error=${encodeURIComponent(error.message)}`);
    }

    const encoded = encodeURIComponent(JSON.stringify(data ?? []));
    redirect(`/dashboard/search?query=${encodeURIComponent(query)}&results=${encoded}`);
  } catch (error) {
    redirect(
      `/dashboard/search?error=${encodeURIComponent(error instanceof Error ? error.message : "Search failed")}`,
    );
  }
}
