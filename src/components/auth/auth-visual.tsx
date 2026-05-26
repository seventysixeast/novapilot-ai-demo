"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/logo";

const QUERIES = [
  "Why did our MRR drop last Tuesday?",
  "Compare CAC across channels this quarter.",
  "Which cohort has the highest LTV?",
  "Flag any revenue anomalies this week.",
  "Show churn risk for enterprise tier.",
];

const ANSWERS = [
  "MRR dropped 4.2% on Tuesday due to 3 enterprise churns. Retention team notified.",
  "Paid social CAC ($48) is 2x organic ($24). Shift budget toward SEO.",
  "Q1 cohort leads with $1,840 LTV - 38% above average.",
  "Alert: $12K spike in refunds on Nov 14. Investigating.",
  "2 enterprise accounts flagged at 73% churn probability. Outreach recommended.",
];

export function AuthVisual() {
  const queryRef = useRef<HTMLSpanElement>(null);
  const answerRef = useRef<HTMLParagraphElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let charIndex = 0;
    let answerCharIndex = 0;
    let phase: "typing" | "answering" | "pausing" | "clearing" = "typing";

    const tick = () => {
      const idx = indexRef.current;
      const query = QUERIES[idx];
      const answer = ANSWERS[idx];

      if (phase === "typing") {
        if (queryRef.current) {
          queryRef.current.textContent = query.slice(0, charIndex + 1);
        }
        charIndex++;
        if (charIndex >= query.length) {
          phase = "answering";
          charIndex = 0;
          timeoutId = setTimeout(tick, 600);
        } else {
          timeoutId = setTimeout(tick, 42);
        }
      } else if (phase === "answering") {
        if (answerRef.current) {
          answerRef.current.textContent = answer.slice(0, answerCharIndex + 1);
        }
        answerCharIndex++;
        if (answerCharIndex >= answer.length) {
          phase = "pausing";
          timeoutId = setTimeout(tick, 2800);
        } else {
          timeoutId = setTimeout(tick, 22);
        }
      } else if (phase === "pausing") {
        phase = "clearing";
        timeoutId = setTimeout(tick, 100);
      } else if (phase === "clearing") {
        if (queryRef.current) queryRef.current.textContent = "";
        if (answerRef.current) answerRef.current.textContent = "";
        charIndex = 0;
        answerCharIndex = 0;
        phase = "typing";
        indexRef.current = (idx + 1) % QUERIES.length;
        timeoutId = setTimeout(tick, 300);
      }
    };

    timeoutId = setTimeout(tick, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#0a0f1e] px-8 py-12 select-none">
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-[80px]" />
        <div className="absolute right-1/4 bottom-1/3 h-72 w-72 rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute left-1/2 bottom-1/4 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-400/8 blur-[60px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-4">
        {/* Brand mark */}
        <div className="mb-2">
          <Logo size="xs" variant="light" />
        </div>

        {/* Metric cards row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "MRR", value: "$15.4K", delta: "+8.4%", up: true },
            { label: "Active Users", value: "1,335", delta: "+12%", up: true },
            { label: "Churn Rate", value: "1.2%", delta: "-0.3%", up: false },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur-sm"
            >
              <p className="text-[10px] font-medium text-slate-500">{m.label}</p>
              <p className="mt-1 text-sm font-bold text-white">{m.value}</p>
              <p className={`mt-0.5 text-[10px] font-medium ${m.up ? "text-emerald-400" : "text-sky-400"}`}>
                {m.delta}
              </p>
            </div>
          ))}
        </div>

        {/* Revenue pulse */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-300">Revenue Pulse</p>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Live
            </span>
          </div>
          <svg viewBox="0 0 280 60" className="h-12 w-full overflow-visible">
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,50 C20,48 30,40 50,35 C70,30 80,32 100,25 C120,18 130,20 150,15 C170,10 180,12 200,8 C220,4 240,6 260,3 L260,60 L0,60 Z"
              fill="url(#sparkGrad)"
            />
            <path
              d="M0,50 C20,48 30,40 50,35 C70,30 80,32 100,25 C120,18 130,20 150,15 C170,10 180,12 200,8 C220,4 240,6 260,3"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Glow dot at end */}
            <circle cx="260" cy="3" r="3" fill="#0ea5e9" />
            <circle cx="260" cy="3" r="6" fill="#0ea5e9" fillOpacity="0.25" />
          </svg>
        </div>

        {/* AI query interface */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                <path d="M9 12h6m-6 4h6M7 8h10M5 20V4a1 1 0 011-1h12a1 1 0 011 1v16l-4-2-4 2-4-2-2 2z" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">AI Query</p>
          </div>
          <div className="rounded-lg bg-white/[0.05] px-3 py-2 font-mono text-xs text-sky-200 min-h-[22px]">
            <span ref={queryRef} />
            <span ref={cursorRef} className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-sky-400" />
          </div>
          {/* Answer stream */}
          <div className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">NovaPilot AI</span>
              <span className="ml-auto text-[10px] text-slate-600">94% confidence</span>
            </div>
            <p ref={answerRef} className="text-xs leading-relaxed text-slate-300 min-h-[32px]" />
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-2">
          {["SOC 2 Ready", "256-bit Encryption", "GDPR Compliant"].map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-slate-500"
            >
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 shrink-0" fill="none">
                <path d="M6 1L1 3.5v3C1 9 3.2 11 6 11c2.8 0 5-2 5-4.5v-3L6 1z" stroke="#64748b" strokeWidth="1" fill="none"/>
                <path d="M4 6l1.5 1.5L8 4.5" stroke="#64748b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
