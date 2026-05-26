"use client";

import { useState } from "react";
import { Sparkles, MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function SetupAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user', content: string }>>([
    { role: 'ai', content: "Hi! I'm your NovaPilot setup assistant. How can I help you configure your workspace today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    // Simulate AI response (since we don't have a specific endpoint for small assistant chat yet, 
    // or we can use a server action if we want real AI)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "To get started, I recommend connecting your Stripe account. This allows me to analyze your MRR velocity and churn patterns immediately. Would you like me to walk you through that?" 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50 group"
      >
        <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-8 w-96 max-h-[600px] bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Setup Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col gap-1.5 max-w-[85%]",
                  m.role === 'user' ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === 'user' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-1 items-center px-2">
                  <div className="h-1 w-1 bg-slate-300 rounded-full animate-bounce" />
                  <div className="h-1 w-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="h-1 w-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for setup help..."
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 py-3 text-sm focus:ring-0 focus:border-sky-400 outline-none"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 top-2 h-8 w-8 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
