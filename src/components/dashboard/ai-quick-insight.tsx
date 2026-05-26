'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function AIQuickInsight({ userContext }: { userContext: string }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getInsight = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/assistant/suggest', {
        method: 'POST',
        body: JSON.stringify({ context: userContext }),
      });
      const data = await response.json();
      setInsight(data.text);
    } catch (err) {
      setInsight("I couldn’t generate a suggestion right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-lg transition-all hover:shadow-xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 opacity-20" />
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
              <Sparkles className="h-5 w-5" />
              {loading && <div className="absolute inset-0 rounded-2xl border-2 border-sky-500 border-t-transparent animate-spin" />}
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick insight</h3>
              <p className="text-sm font-bold text-slate-900">What to look at next</p>
            </div>
          </div>
          
          {!insight && !loading && (
            <button 
              onClick={getInsight}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-sky-500 hover:scale-105 active:scale-95"
            >
              Get insight <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 py-2"
            >
              <div className="flex gap-1">
                <div className="h-1 w-1 bg-sky-500 rounded-full animate-bounce" />
                <div className="h-1 w-1 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="h-1 w-1 bg-sky-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter italic">Thinking through your data...</p>
            </motion.div>
          ) : insight ? (
            <motion.div 
              key="insight"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100"
            >
              <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                "{insight}"
              </p>
            </motion.div>
          ) : (
            <p className="text-xs text-slate-500 font-medium">
              Click to get a short, practical recommendation based on your current data.
            </p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
