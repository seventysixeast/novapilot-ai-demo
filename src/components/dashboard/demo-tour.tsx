"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const steps = [
  "Welcome to Showcase Mode. This walkthrough highlights your premium AI SaaS experience.",
  "Use AI Chat for client-ready assistant demos with rich markdown and code rendering.",
  "Use Documents and Vector Search to show retrieval and knowledge workflows.",
  "Use Analytics to demonstrate usage intelligence, KPI visibility, and cost tracking.",
];

export function DemoTour() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(searchParams.get("tour") === "1");
  const [step, setStep] = useState(0);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 p-4 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Showcase step {step + 1}/{steps.length}
              </p>
              <p className="mt-3 text-sm text-slate-700">{steps[step]}</p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (step === steps.length - 1) {
                      setOpen(false);
                    } else {
                      setStep((prev) => prev + 1);
                    }
                  }}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white"
                >
                  {step === steps.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
