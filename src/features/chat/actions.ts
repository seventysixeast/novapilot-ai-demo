"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/server/tenant";

export async function sendMessage(formData: FormData) {
  const content = formData.get("content") as string;
  let threadId = formData.get("thread_id") as string;

  if (!content) return;

  const membership = await getCurrentMembership();
  if (!membership) {
    return redirect("/login?error=Session expired");
  }

  const supabase = await createClient();
  const adminClient = await createAdminClient();

  // 1. Ensure thread exists (with admin fallback)
  if (!threadId) {
    console.log("[CHAT] Creating new thread...");
    const { data: thread, error: threadError } = await adminClient
      .from("chat_threads")
      .insert({
        organization_id: membership.organizationId,
        created_by: membership.userId,
        title: content.slice(0, 40) + (content.length > 40 ? "..." : ""),
      })
      .select()
      .single();

    if (threadError || !thread) {
      console.error("[CHAT] Thread creation failed:", threadError);
      return redirect("/dashboard/chat?error=Unable to create thread. Please try again.");
    }
    threadId = thread.id;
  }

  // 2. Save User Message (using admin client to bypass RLS issues)
  const { error: userMsgError } = await adminClient.from("chat_messages").insert({
    thread_id: threadId,
    organization_id: membership.organizationId,
    role: "user",
    content,
  });

  if (userMsgError) {
    console.error("[CHAT] Failed to save user message:", userMsgError);
    return redirect(`/dashboard/chat?thread=${threadId}&error=Message failed to save`);
  }

  const { data: connectedSources } = await supabase
    .from("data_connections")
    .select("provider, status, last_synced_at")
    .eq("organization_id", membership.organizationId);

  const freshSources = (connectedSources ?? []).filter(
    (s) => s.status === "connected" && s.last_synced_at && new Date(s.last_synced_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  // 3. AI Generation Logic
  let assistantContent = "I don't have enough data to answer that accurately. Please connect a data source.";
  let inputTokens = 0;
  let outputTokens = 0;
  let usedFallback = false;
  let citations: any[] = [];
  let isFromCache = false;

  try {
      const { searchKnowledge } = await import("@/lib/ai/vector");
      const { aiRouter } = await import("@/lib/ai/router");

      // Fetch latest analytics metrics synced from Stripe/HubSpot/GA4
      const { data: latestMetrics } = await supabase
        .from("analytics_metrics")
        .select("metric_date, mrr, active_users, cac, ltv, anomaly_score, anomaly_description")
        .eq("organization_id", membership.organizationId)
        .order("metric_date", { ascending: false })
        .limit(7);

      const metricsContext = latestMetrics && latestMetrics.length > 0
        ? `\n\nLatest System Analytics Metrics (synced from Stripe/HubSpot/GA4):\n` +
          latestMetrics.map(m => `- Date: ${m.metric_date}, MRR: $${m.mrr}, Active Users: ${m.active_users}, CAC: $${m.cac || 0}, LTV: $${m.ltv || 0}${m.anomaly_description ? ` (Anomaly Alert: ${m.anomaly_description})` : ""}`).join('\n')
        : "\n\nSystem Analytics Metrics: No metrics synced yet. Recommend connecting Stripe, HubSpot, or Google Analytics 4.";

      // Fetch previous conversation history for this thread
      const { data: threadMessages } = await adminClient
        .from("chat_messages")
        .select("role, content")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(12);

      let conversationHistory = "";
      if (threadMessages && threadMessages.length > 1) {
        const previousMessages = threadMessages.slice(0, -1);
        conversationHistory = "\n\nRecent Conversation History:\n" +
          previousMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      }

      const knowledge = await searchKnowledge(content, membership.organizationId);
      const contextString = knowledge.length > 0 
        ? `\n\nContext from Knowledge Base:\n${knowledge.map(k => `- ${k.content}`).join('\n')}`
        : "";

      const promptText = `User Current Message: ${content}

${conversationHistory}
${contextString}
${metricsContext}

Rules:
1) Use the provided context and conversation history to construct your response.
2) If the user's question references past messages (using pronouns like "this", "it", "that", "earlier", "their", etc.), resolve them using the conversation history.
3) If no context or history is relevant, explain why.
4) Professional tone.
5) Always reference the synced analytics metrics (like MRR, Active Users, LTV, CAC) when asked about growth, pipeline performance, anomalies, or system metrics.`;

      const response = await aiRouter.generateCompletion(
        promptText,
        "PREMIUM"
      );

      assistantContent = response.text;
      inputTokens = response.usage.inputTokens;
      outputTokens = response.usage.outputTokens;
      usedFallback = !!response.isFallback;
      citations = knowledge.map(k => ({
        provider: k.metadata.source_type || 'knowledge',
        sourceRef: k.metadata.source_id || 'internal',
        freshnessAt: k.metadata.last_synced_at || null
      }));

    } catch (error) {
      console.error("[CHAT] AI Error:", error);
      assistantContent = "The intelligence engine encountered an error. Please try again in a moment.";
    }

  // 4. Save AI Response
  const finalContent = assistantContent;
  const { data: aiQuery } = await adminClient
    .from("ai_queries")
    .insert({
      organization_id: membership.organizationId,
      user_id: membership.userId,
      thread_id: threadId,
      query_text: content,
      answer_text: finalContent,
      confidence_score: 95,
      freshness_status: "fresh"
    })
    .select()
    .single();

  await adminClient.from("chat_messages").insert({
    thread_id: threadId,
    organization_id: membership.organizationId,
    role: "assistant",
    content: finalContent,
  });

  if (aiQuery && (freshSources.length > 0 || citations.length > 0)) {
    const allCitations = [
      ...freshSources.map(s => ({
        ai_query_id: aiQuery.id,
        organization_id: membership.organizationId,
        provider: s.provider,
        source_ref: "latest_sync",
        freshness_at: s.last_synced_at
      })),
      ...citations.map(c => ({
        ai_query_id: aiQuery.id,
        organization_id: membership.organizationId,
        provider: c.provider,
        source_ref: c.sourceRef,
        freshness_at: c.freshnessAt
      }))
    ];
    await adminClient.from("ai_query_citations").insert(allCitations);
  }

  // 5. Usage Logging
  if (inputTokens > 0) {
    await adminClient.from("ai_usage_logs").insert({
      organization_id: membership.organizationId,
      user_id: membership.userId,
      provider: "router",
      model: "dynamic",
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
    });
  }

  revalidatePath("/dashboard/chat");
  redirect(`/dashboard/chat?thread=${threadId}`);
}

export async function deleteThread(formData: FormData) {
  const threadId = formData.get("thread_id") as string;
  if (!threadId) return;

  const membership = await getCurrentMembership();
  if (!membership) return redirect("/login?error=Session expired");

  const adminClient = await createAdminClient();

  const { error } = await adminClient
    .from("chat_threads")
    .delete()
    .eq("id", threadId)
    .eq("organization_id", membership.organizationId);

  if (error) {
    console.error("[CHAT] Failed to delete thread:", error);
    return redirect(`/dashboard/chat?error=Failed to delete conversation`);
  }

  revalidatePath("/dashboard/chat");
  redirect("/dashboard/chat");
}
