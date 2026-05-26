"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, Database, CheckCircle2, TrendingUp, Zap } from "lucide-react";

export function HeroAnimation() {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const fullQuery = "Why did MRR spike this week?";
  const fullAnswer = "MRR grew 8.4% driven by 3 Enterprise upgrades and 14 new Pro users converting from trial.";

  useEffect(() => {
    let isMounted = true;

    const playSequence = async () => {
      // Reset
      setStep(0);
      setText("");
      await new Promise((r) => setTimeout(r, 800));

      // 1. Typing Query
      setStep(1);
      for (let i = 0; i <= fullQuery.length; i++) {
        if (!isMounted) return;
        setText(fullQuery.substring(0, i));
        await new Promise((r) => setTimeout(r, 40 + Math.random() * 30));
      }

      await new Promise((r) => setTimeout(r, 500));

      // 2. Processing/Searching
      if (!isMounted) return;
      setStep(2);
      await new Promise((r) => setTimeout(r, 1500));

      // 3. Streaming Answer
      if (!isMounted) return;
      setStep(3);
      setText("");
      for (let i = 0; i <= fullAnswer.length; i++) {
        if (!isMounted) return;
        setText(fullAnswer.substring(0, i));
        await new Promise((r) => setTimeout(r, 15 + Math.random() * 20));
      }

      await new Promise((r) => setTimeout(r, 400));

      // 4. Sources & Graph reveal
      if (!isMounted) return;
      setStep(4);
    };

    playSequence();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative mx-auto mt-16 max-w-3xl overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 p-2 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-sky-500/10">
      <motion.div 
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%"],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        className="absolute -inset-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-300/40 via-violet-300/40 to-emerald-300/40 blur-2xl" 
      />
      
      <div className="relative rounded-xl border border-slate-200/60 bg-white/90 p-6 shadow-sm backdrop-blur-md">
        {/* Input area */}
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner">
          <Sparkles className="h-5 w-5 text-sky-500" />
          <div className="flex-1 font-medium text-slate-700">
            {step === 0 ? (
              <span className="text-slate-400">Ask any question about your growth...</span>
            ) : (
              <span>
                {step === 1 ? text : fullQuery}
                {step === 1 && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.7 }} className="inline-block h-4 w-0.5 translate-y-0.5 bg-sky-500 ml-0.5" />}
              </span>
            )}
          </div>
        </div>

        {/* Response Area */}
        <div className="mt-6 min-h-[220px]">
          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4 text-sm text-slate-500"
              >
                <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-slate-100">
                  <Database className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>Querying Stripe...</motion.span>
                  <span className="text-slate-300">•</span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}>Analyzing anomalies...</motion.span>
                </div>
              </motion.div>
            )}

            {step >= 3 && (
              <motion.div
                key="answer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-violet-500 shadow-sm">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 space-y-4 pt-1">
                    <p className="text-lg font-medium leading-relaxed text-slate-800">
                      {step === 3 ? text : fullAnswer}
                      {step === 3 && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.7 }} className="inline-block h-5 w-0.5 translate-y-0.5 bg-slate-400 ml-1" />}
                    </p>

                    {/* Metadata chips (Confidence, sources) */}
                    {step === 4 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-3 pt-2"
                      >
                        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          94% Confidence
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                          <Database className="h-3.5 w-3.5 text-slate-400" />
                          Sources: Stripe, HubSpot
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          Live Data
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Simulated Chart Reveal */}
                {step === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 20 }}
                    className="ml-12 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/50 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-semibold text-sky-900">MRR Impact</span>
                      </div>
                      <span className="text-xs font-bold text-sky-600">+ $1,420</span>
                    </div>
                    {/* Simulated Graph Bars */}
                    <div className="flex items-end gap-2 h-24 pb-2">
                      {[30, 45, 40, 60, 55, 80, 100].map((height, i) => (
                        <div key={i} className="relative flex-1 group">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: 0.7 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                            className={`w-full rounded-t-sm ${i === 6 ? 'bg-sky-500' : 'bg-sky-200 group-hover:bg-sky-300'} transition-colors`}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
