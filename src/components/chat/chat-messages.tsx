"use client";

import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Sparkles, Shield, Zap, AlertCircle, X, ArrowUpRight,
  CheckCircle2, Copy, Check, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Citation = { provider: string; sourceRef: string; freshnessAt: string | null };
type TrustMeta = { confidence: number; freshness: "fresh" | "stale" | "unknown"; citations: Citation[] };
type ChatMessage = { id: string; role: "system" | "user" | "assistant"; content: string };

function parseTrustSummary(content: string): { body: string; confidence?: number; freshness?: string } {
  const confidenceMatch = content.match(/Confidence:\s*(\d+)%/i);
  const freshnessMatch = content.match(/Freshness:\s*(fresh|stale|unknown)/i);
  const body = content
    .replace(/\n*Confidence:\s*\d+%\n*/gi, "\n")
    .replace(/\n*Sources:\s*.+\n*/gi, "\n")
    .replace(/\n*Freshness:\s*(fresh|stale|unknown)\n*/gi, "\n")
    .trim();
  return { body, confidence: confidenceMatch ? Number(confidenceMatch[1]) : undefined, freshness: freshnessMatch?.[1] };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-300 opacity-0 transition-all group-hover/code:opacity-100 hover:bg-sky-500 hover:text-white"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ChatMessages({
  messages,
  trustByMessageId = {},
}: {
  messages: ChatMessage[];
  trustByMessageId?: Record<string, TrustMeta | undefined>;
}) {
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedTrust = openSourceId ? trustByMessageId[openSourceId] : undefined;

  const visible = useMemo(() => messages.filter((m) => m.role !== "system"), [messages]);

  // Auto-scroll to bottom when new messages arrive or content changes
  useEffect(() => {
    // We scroll if the length changes OR if the last message content changes (for streaming)
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [visible.length, visible[visible.length - 1]?.content]);

  if (!visible.length) return null;

  return (
    <>
      <div className="space-y-4 pb-8">
        {visible.map((message, index) => {
          const isAssistant = message.role === "assistant";
          const trust = trustByMessageId[message.id];
          const parsed = parseTrustSummary(message.content);

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
              className={cn("flex gap-3", isAssistant ? "justify-start" : "justify-end")}
            >
              {/* Avatar — assistant left */}
              {isAssistant && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-sm mt-1">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                </div>
              )}

              <div className={cn("flex flex-col gap-1.5", isAssistant ? "items-start max-w-[80%]" : "items-end max-w-[75%]")}>
                {/* Role label */}
                <span className="px-1 text-[10px] font-medium text-slate-400">
                  {isAssistant ? "NovaPilot" : "You"}
                </span>

                {/* Bubble */}
                <div
                  className={cn(
                    "relative rounded-2xl border px-5 py-4 text-sm leading-6 shadow-sm transition-shadow",
                    isAssistant
                      ? "rounded-tl-md bg-white border-slate-200 text-slate-800 shadow-slate-200/60 hover:shadow-md"
                      : "rounded-tr-md bg-slate-900 border-slate-800 text-slate-100",
                  )}
                >
                  {/* Trust bar — assistant only */}
                  {isAssistant && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        {/* Confidence */}
                        {(() => {
                          const conf = trust?.confidence ?? parsed.confidence ?? 95;
                          const color = conf >= 85 ? "text-emerald-600" : conf >= 65 ? "text-amber-600" : "text-rose-600";
                          const bg = conf >= 85 ? "bg-emerald-50 border-emerald-100" : conf >= 65 ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-100";
                          return (
                            <span className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold", bg, color)}>
                              <CheckCircle2 className="h-3 w-3" />
                              {conf}% confidence
                            </span>
                          );
                        })()}
                        {/* Freshness */}
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Zap className="h-3 w-3 text-sky-400" />
                          <span className="capitalize">{trust?.freshness ?? parsed.freshness ?? "fresh"}</span>
                        </span>
                      </div>
                      {/* View sources button */}
                      <button
                        type="button"
                        onClick={() => setOpenSourceId(message.id)}
                        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                      >
                        <Shield className="h-3 w-3" />
                        View sources
                      </button>
                    </div>
                  )}

                  {/* Markdown content */}
                  <div
                    className={cn(
                      "prose prose-sm max-w-none",
                      "prose-p:my-1.5 prose-p:leading-7",
                      "prose-strong:font-semibold",
                      "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
                      "prose-headings:font-semibold prose-headings:my-2",
                      "prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.8em] prose-code:font-mono prose-code:text-slate-800",
                      "prose-pre:my-3 prose-pre:rounded-xl prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5",
                      !isAssistant && "prose-invert prose-code:bg-white/10 prose-code:text-white",
                    )}
                  >
                    <ReactMarkdown
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code({ children, className }) {
                          const isBlock = className?.includes("language-");
                          if (!isBlock) return <code className={className}>{children}</code>;
                          return (
                            <div className="group/code relative">
                              <div className="absolute right-3 top-3">
                                <CopyButton text={String(children)} />
                              </div>
                              <code className={cn(className, "block p-4 text-[0.8em]")}>{children}</code>
                            </div>
                          );
                        },
                      }}
                    >
                      {parsed.body}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Avatar — user right */}
              {!isAssistant && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 shadow-sm mt-1">
                  <User className="h-3.5 w-3.5 text-slate-600" />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Source drawer */}
      <AnimatePresence>
        {openSourceId && (
          <SourceDrawer trust={selectedTrust} onClose={() => setOpenSourceId(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────
   Source Drawer / Popup
───────────────────────────────────────────── */
function SourceDrawer({ trust, onClose }: { trust?: TrustMeta; onClose: () => void }) {
  const citations = useMemo(() => trust?.citations ?? [], [trust]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-end sm:items-stretch">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-sky-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-600">Source Audit</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Answer Sources</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {citations.length > 0 ? `${citations.length} source${citations.length > 1 ? "s" : ""} used` : "No sources attached"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {citations.length > 0 ? (
            citations.map((citation, i) => (
              <div
                key={`${citation.provider}-${i}`}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:border-sky-200 hover:bg-sky-50/30"
              >
                {/* Source header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-[11px] font-bold text-sky-600">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400">Provider</p>
                      <p className="text-sm font-semibold text-slate-900">{citation.provider}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Verified
                  </span>
                </div>

                {/* Source ref */}
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-500 break-all leading-relaxed">
                  {citation.sourceRef}
                </div>

                {/* Timestamp */}
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Sync timestamp</span>
                  <span className="font-medium text-slate-700">
                    {citation.freshnessAt
                      ? new Date(citation.freshnessAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Real-time"}
                  </span>
                </div>

                {/* Open button */}
                <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white">
                  Open source <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No sources attached</p>
              <p className="mt-1 max-w-[220px] text-xs text-slate-500">
                This answer came from built-in knowledge or general reasoning.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-3 text-[10px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-[0.99]"
          >
            Close
          </button>
        </div>
      </motion.aside>
    </div>
  );
}
