"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessages } from "./chat-messages";
import {
  MessageSquare, Sparkles, Zap, Shield, AlertCircle,
  Plus, Trash2, ArrowUp, Loader2, Database, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { deleteThread } from "@/features/chat/actions";

type Citation = { provider: string; sourceRef: string; freshnessAt: string | null };
type TrustMeta = { confidence: number; freshness: "fresh" | "stale" | "unknown"; citations: Citation[] };
type ChatMessage = { id: string; role: "system" | "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "What changed this week?",
  "How is revenue trending?",
  "Any alerts I should know about?",
  "Summarize recent documents.",
];

interface ChatWorkspaceProps {
  initialMessages: ChatMessage[];
  threadId?: string;
  threads: Array<{ id: string; title: string; created_at: string }>;
  freshness: Array<{ provider: string; status: string; last_synced_at: string | null }>;
  trustByMessageId: Record<string, TrustMeta | undefined>;
  errorParam?: string;
}

export function ChatWorkspace({
  initialMessages,
  threadId: initialThreadId,
  threads,
  freshness,
  trustByMessageId: initialTrustByMessageId,
  errorParam,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [inputContent, setInputContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | undefined>(errorParam);
  const [trustByMessageId, setTrustByMessageId] = useState<Record<string, TrustMeta | undefined>>(initialTrustByMessageId);
  const [threadToDelete, setThreadToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sync state with server props when threadId changes
  useEffect(() => {
    setMessages(initialMessages);
    setThreadId(initialThreadId);
    setTrustByMessageId(initialTrustByMessageId);
    setError(errorParam);
  }, [initialMessages, initialThreadId, initialTrustByMessageId, errorParam]);

  // Auto-scroll when messages change or while streaming
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isStreaming]);

  const handleSuggestionClick = (text: string) => {
    setInputContent(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || isStreaming) return;

    const userMessageContent = inputContent.trim();
    setInputContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setError(undefined);

    const userMsgId = `temp-user-${Date.now()}`;
    const assistantMsgId = `temp-assistant-${Date.now()}`;

    // 1. Add User Message & Assistant typing placeholder to local state
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, role: "user", content: userMessageContent },
      { id: assistantMsgId, role: "assistant", content: "" }
    ];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      // 2. Fetch the stream from the new /api/chat/stream endpoint
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessageContent, threadId })
      });

      if (!response.ok) {
        throw new Error("Failed to send message. Please try again.");
      }

      if (!response.body) {
        throw new Error("No response body received from stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let activeThreadId = threadId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value);

        // Detect if the chunk contains thread metadata
        if (textChunk.startsWith("__THREAD_ID__:")) {
          const parsedId = textChunk.split("\n")[0].split(":")[1].trim();
          activeThreadId = parsedId;
          setThreadId(parsedId);
          // Push State/URL update silently so page isn't force reloaded, but stays synced
          window.history.pushState(null, "", `/dashboard/chat?thread=${parsedId}`);
          continue;
        }

        assistantText += textChunk;

        // Update the assistant message content in state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: assistantText } : msg
          )
        );
      }

      // 3. Update trust score meta for the new assistant response (dynamic mock metadata)
      setTrustByMessageId((prev) => ({
        ...prev,
        [assistantMsgId]: {
          confidence: 95,
          freshness: "fresh",
          citations: [
            { provider: "internal", sourceRef: "grounded_analytics", freshnessAt: new Date().toISOString() }
          ]
        }
      }));

      // Caching disabled. Proceeding directly.

      setIsStreaming(false);

      // Refresh page in background to synchronize past threads inside sidebar without reloading state
      router.refresh();

    } catch (err: any) {
      console.error("[STREAM CLIENT ERROR]:", err);
      setError(err.message || "Something went wrong.");
      setIsStreaming(false);
      // Remove assistant placeholder on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
    }
  };

  const hasMessages = messages.filter((m) => m.role !== "system").length > 0;

  return (
    <div className="flex h-[calc(100vh-13rem)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* ── LEFT CHAT HISTORY SIDEBAR ── */}
      <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 bg-slate-50/50">
        
        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-100">
          <Link
            href="/dashboard/chat?new=true"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-950 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-sky-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Link>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Conversations</span>
            <span className="bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{threads.length}</span>
          </div>

          {threads.length ? (
            threads.map((t) => {
              const isActive = t.id === threadId;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all",
                    isActive
                      ? "bg-sky-50 border border-sky-100 text-sky-700 shadow-sm shadow-sky-500/5 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Link
                    href={`/dashboard/chat?thread=${t.id}`}
                    className="flex-1 truncate pr-2 py-0.5"
                  >
                    {t.title || "Untitled Conversation"}
                  </Link>

                  {/* Delete Conversation Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setThreadToDelete({ id: t.id, title: t.title || "Untitled Conversation" });
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No previous chats
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT MAIN CHAT AREA ── */}
      <div className="flex flex-col flex-1 min-h-0 bg-white">
        
        {/* ── TOP STATIC SECTION ── */}
        <div className="shrink-0 space-y-2 p-4 lg:p-6 border-b border-slate-100 bg-slate-50/30">

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-3 text-white shadow-xl shadow-slate-900/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.15),transparent_50%)]" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Ask NovaPilot</h1>
                  <p className="text-[11px] text-slate-400">Source-grounded answers with full citations</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400">AI Ready</span>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <p className="text-sm font-medium text-rose-800">{error}</p>
            </div>
          )}

          {/* Sources strip */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-1">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Connected Sources</span>
              </div>
              <span className="text-[10px] text-slate-400">Grounding live responses</span>
            </div>
            <div className="flex flex-wrap gap-2 px-4 py-1.5">
              {freshness.length ? (
                freshness.map((item) => (
                  <div
                    key={item.provider}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
                      item.status === "connected"
                        ? "border-emerald-100 bg-emerald-50/60"
                        : "border-slate-100 bg-slate-50",
                    )}
                  >
                    <div className={cn("h-1.5 w-1.5 rounded-full", item.status === "connected" ? "bg-emerald-500" : "bg-slate-300")} />
                    <span className="font-semibold text-slate-700">{item.provider}</span>
                    {item.last_synced_at && (
                      <span className="text-slate-400" suppressHydrationWarning>
                        {new Date(item.last_synced_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex w-full items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-xs font-medium text-amber-800">No connected sources — answers will use general reasoning</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE MESSAGE AREA ── */}
        <div 
          className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-6 py-4 lg:px-10 [overscroll-behavior:contain] [scrollbar-gutter:stable]"
        >
          {hasMessages ? (
            <ChatMessages messages={messages} trustByMessageId={trustByMessageId} />
          ) : (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 shadow-sm ring-1 ring-slate-100">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Start a conversation</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500">
                Ask about revenue, documents, alerts, or anything in your workspace.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2.5 text-left sm:grid-cols-3">
                {[
                  { icon: Zap, label: "Growth", prompt: "What changed in revenue this week?" },
                  { icon: Shield, label: "Intelligence", prompt: "Which documents are most referenced?" },
                  { icon: Sparkles, label: "Insights", prompt: "Summarize top customer feedback." },
                ].map(({ icon: Icon, label, prompt }) => (
                  <div 
                    key={label} 
                    onClick={() => handleSuggestionClick(prompt)}
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md cursor-pointer"
                  >
                    <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">&ldquo;{prompt}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 justify-start mt-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-sm mt-1">
                <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1.5 items-start">
                <span className="px-1 text-[10px] font-medium text-slate-400">NovaPilot</span>
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── BOTTOM INPUT ── */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 p-4 lg:p-6">
          <div className="space-y-2">
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => handleSuggestionClick(text)}
                  disabled={isStreaming}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-200/50 transition-all focus-within:border-sky-300 focus-within:shadow-sky-100/50"
            >
              {/* NovaPilot badge */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                name="content"
                value={inputContent}
                disabled={isStreaming}
                onChange={(e) => {
                  setInputContent(e.target.value);
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
                }}
                placeholder="Ask NovaPilot anything about your workspace..."
                rows={1}
                required
                className="max-h-36 flex-1 resize-none bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 leading-normal disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inputContent.trim().length > 0 && !isStreaming) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
              />

              {/* Send Button */}
              <div>
                <button
                  type="submit"
                  disabled={isStreaming || inputContent.trim().length === 0}
                  aria-label="Send message"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md transition-all hover:bg-sky-600 hover:shadow-sky-300/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {threadToDelete && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900">Delete chat?</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    This will permanently delete the conversation history for <span className="font-semibold text-slate-800">"{threadToDelete.title}"</span>. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setThreadToDelete(null)}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <form
                  action={deleteThread}
                  onSubmit={() => {
                    setThreadToDelete(null);
                  }}
                >
                  <input type="hidden" name="thread_id" value={threadToDelete.id} />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-600/10 transition-all hover:bg-rose-700 active:scale-95"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
