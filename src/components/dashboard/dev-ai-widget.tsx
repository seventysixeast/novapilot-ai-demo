"use client";

import { useState } from "react";
import { Activity, ChevronUp, ChevronDown, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function DevAIWidget({ isTester }: { isTester: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!isTester) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-72 rounded-[2rem] bg-slate-900 border border-slate-800 p-8 text-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative"
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[60px] pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Runtime</h3>
                </div>
                <Command className="h-3.5 w-3.5 text-slate-600" />
              </div>

              <div className="space-y-6">
                <StatusItem label="Default model" value="Llama-3.3" subValue="Fast answers" />
                <StatusItem label="Deep model" value="Gemini-2.0" subValue="Better reasoning" />
                <StatusItem label="Fallback" value="Ready" color="text-emerald-400" />
                <StatusItem label="Tester access" value="On" color="text-sky-400" />
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Diagnostic v2.4.0</span>
                <Activity className="h-3 w-3 text-sky-500 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all shadow-2xl active:scale-95 group",
          isOpen 
            ? "bg-white border-slate-200 text-slate-900" 
            : "bg-slate-950 border-slate-800 text-white hover:bg-slate-900 hover:-translate-y-0.5"
        )}
      >
        <div className={cn(
          "h-2 w-2 rounded-full",
          isOpen ? "bg-slate-200" : "bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.6)]"
        )} />
        <span className="text-[10px] font-black uppercase tracking-[0.25em]">Test console</span>
        {isOpen ? <ChevronDown className="h-3 w-3 opacity-40" /> : <ChevronUp className="h-3 w-3 opacity-40 group-hover:translate-y-[-2px] transition-transform" />}
      </button>
    </div>
  );
}

function StatusItem({ label, value, subValue, color }: { label: string; value: string; subValue?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 group/item">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/item:text-slate-400 transition-colors">{label}</span>
      <div className="text-right">
        <p className={cn("text-xs font-black uppercase tracking-tight", color || "text-white")}>{value}</p>
        {subValue && <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}
