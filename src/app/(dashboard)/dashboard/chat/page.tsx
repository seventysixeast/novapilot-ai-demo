import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ thread?: string; error?: string; demo?: string; new?: string }>;

interface DbChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  created_at: string;
}

export default async function ChatPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const membership = await getCurrentMembership();
  const supabase = await createClient();

  const isNewChat = searchParams.new === "true";
  let messages: DbChatMessage[] | null = null;
  let currentThreadId = isNewChat ? undefined : searchParams.thread;

  // 1. Fetch latest thread if none specified
  if (!currentThreadId && membership && !isNewChat) {
    const { data: latestThread } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestThread) currentThreadId = latestThread.id;
  }

  // 2. Fetch thread messages
  if (currentThreadId && membership) {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("thread_id", currentThreadId)
      .order("created_at", { ascending: true });
    messages = (data ?? []) as DbChatMessage[];
  }

  // 3. Fetch past conversations (threads) for the sidebar
  let threads: Array<{ id: string; title: string; created_at: string }> = [];
  if (membership) {
    const { data } = await supabase
      .from("chat_threads")
      .select("id, title, created_at")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false });
    threads = (data ?? []) as typeof threads;
  }

  const trustByMessageId: Record<
    string,
    { confidence: number; freshness: "fresh" | "stale" | "unknown"; citations: Array<{ provider: string; sourceRef: string; freshnessAt: string | null }> }
  > = {};

  if (currentThreadId && membership) {
    const { data: queries } = await supabase
      .from("ai_queries")
      .select("id, answer_text, confidence_score, freshness_status")
      .eq("organization_id", membership.organizationId)
      .eq("thread_id", currentThreadId)
      .order("created_at", { ascending: true });

    const queryRows = (queries ?? []) as Array<{ id: string; answer_text: string | null; confidence_score: number; freshness_status: "fresh" | "stale" | "unknown" }>;
    let citationsByQueryId: Record<string, Array<{ provider: string; sourceRef: string; freshnessAt: string | null }>> = {};

    if (queryRows.length) {
      const { data: citations } = await supabase
        .from("ai_query_citations")
        .select("ai_query_id, provider, source_ref, freshness_at")
        .in("ai_query_id", queryRows.map((q) => q.id));
      const citationRows = (citations ?? []) as Array<{ ai_query_id: string; provider: string; source_ref: string; freshness_at: string | null }>;
      citationsByQueryId = citationRows.reduce((acc, c) => {
        const existing = acc[c.ai_query_id] ?? [];
        existing.push({ provider: c.provider, sourceRef: c.source_ref, freshnessAt: c.freshness_at });
        acc[c.ai_query_id] = existing;
        return acc;
      }, {} as Record<string, Array<{ provider: string; sourceRef: string; freshnessAt: string | null }>>);
    }

    const assistantMessages = (messages ?? []).filter((m) => m.role === "assistant");
    assistantMessages.forEach((message, idx) => {
      const query = queryRows.find((row) => {
        if (!row.answer_text) return false;
        return message.content.startsWith(row.answer_text.split("\n\nConfidence:")[0]);
      }) || queryRows[idx];
      if (query) {
        trustByMessageId[message.id] = {
          confidence: query.confidence_score,
          freshness: query.freshness_status,
          citations: citationsByQueryId[query.id] ?? [],
        };
      }
    });
  }

  let freshness: Array<{ provider: string; status: string; last_synced_at: string | null }> = [];
  if (membership) {
    const { data } = await supabase
      .from("data_connections")
      .select("provider, status, last_synced_at")
      .eq("organization_id", membership.organizationId)
      .order("provider");
    freshness = (data ?? []) as typeof freshness;
  }

  return (
    <ChatWorkspace
      initialMessages={messages ?? []}
      threadId={currentThreadId}
      threads={threads}
      freshness={freshness}
      trustByMessageId={trustByMessageId}
      errorParam={searchParams.error}
    />
  );
}
