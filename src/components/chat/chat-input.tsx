"use client";

import { Sparkles, ArrowUp, Loader2 } from "lucide-react";
import { sendMessage } from "@/features/chat/actions";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

const QUICK_PROMPTS = [
  "What changed this week?",
  "How is revenue trending?",
  "Any alerts I should know about?",
  "Summarize recent documents.",
];

function SendButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-label="Send message"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md transition-all hover:bg-sky-600 hover:shadow-sky-300/40 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
    </button>
  );
}

export function ChatInput({ threadId }: { threadId?: string }) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSuggestionClick = (text: string) => {
    setContent(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
        }
      }, 0);
    }
  };

  return (
    <div className="space-y-2">
      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => handleSuggestionClick(text)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            {text}
          </button>
        ))}
      </div>

      {/* Input form */}
      <form
        action={async (formData) => {
          setContent("");
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
          await sendMessage(formData);
        }}
        className="flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-200/50 transition-all focus-within:border-sky-300 focus-within:shadow-sky-100/50"
      >
        <input type="hidden" name="thread_id" value={threadId ?? ""} />

        {/* NovaPilot badge */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900">
          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          name="content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
          }}
          placeholder="Ask NovaPilot anything about your workspace..."
          rows={1}
          required
          className="max-h-36 flex-1 resize-none bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 leading-normal"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (content.trim().length > 0) {
                e.currentTarget.form?.requestSubmit();
              }
            }
          }}
        />

        {/* Send Button */}
        <div>
          <SendButton disabled={content.trim().length === 0} />
        </div>
      </form>
    </div>
  );
}
