"use client";

import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const LOADING_STEPS = [
  "Connecting to secure workspace...",
  "Loading database connections...",
  "Initializing AI model components...",
  "Synthesizing layout data...",
  "Finalizing workspace views..."
];

export default function DashboardLoading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic abstract glowing backdrops */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass max-w-md w-full p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center text-center space-y-6 z-10"
      >
        {/* Outer glowing loader icon */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Rotating gradient background border */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-400 to-teal-400 p-[3px] opacity-75 shadow-lg shadow-blue-500/20"
          >
            <div className="w-full h-full bg-white rounded-full" />
          </motion.div>

          {/* Pulse background overlay */}
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute inset-2 bg-blue-50/50 rounded-full border border-blue-100"
          />

          {/* Core loader icon */}
          <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </motion.div>
          </div>

          {/* Mini decorator badge */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md border border-white/80"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </motion.div>
        </div>

        {/* Text descriptions */}
        <div className="space-y-2 w-full">
          <h3 className="text-lg font-semibold tracking-tight text-slate-800 flex items-center justify-center gap-2">
            Preparing Workspace
          </h3>
          
          <div className="h-6 flex items-center justify-center">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-medium text-slate-500 animate-pulse"
            >
              {LOADING_STEPS[step]}
            </motion.p>
          </div>
        </div>

        {/* Sleek dynamic progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
          <motion.div
            initial={{ width: "5%" }}
            animate={{ width: ["15%", "45%", "75%", "95%"] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut"
            }}
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
