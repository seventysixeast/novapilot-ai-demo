"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PRICING_PLANS } from "@/lib/billing/plans";

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  const plans = useMemo(
    () => [
      { code: "basic", ...PRICING_PLANS.basic },
      { code: "pro", ...PRICING_PLANS.pro },
      { code: "enterprise", ...PRICING_PLANS.enterprise },
    ],
    [],
  );

  return (
    <section id="pricing" className="card relative overflow-hidden p-8 md:p-12">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="text-center space-y-6">
        <h2 className="text-4xl font-black tracking-tight text-slate-900">Plans for every stage</h2>
        <p className="mx-auto max-w-2xl text-slate-600 font-medium">
          Start free, then upgrade when you need more answers, more sources, or more team access. Every plan starts with a{" "}
          <span className="font-bold text-sky-600">14-day Pro trial</span>.
        </p>

        <div className="pt-4">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5 text-xs font-bold shadow-sm">
            <button
              className={cn(
                "rounded-xl px-8 py-2.5 transition-all",
                !yearly ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700",
              )}
              onClick={() => setYearly(false)}
            >
              Monthly
            </button>
            <button
              className={cn(
                "rounded-xl px-8 py-2.5 transition-all flex items-center gap-2",
                yearly ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700",
              )}
              onClick={() => setYearly(true)}
            >
              Annual
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {plans.map((tier) => {
          const monthlyPrice = tier.price;
          const yearlyPrice = Math.floor(tier.price * 0.8 * 12);
          const currentPrice = yearly ? Math.floor(tier.price * 0.8) : monthlyPrice;

          return (
            <article
              key={tier.code}
              className={cn(
                "relative flex flex-col justify-between rounded-[2.5rem] border bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl",
                tier.code === "pro" ? "border-sky-200 ring-4 ring-sky-50 scale-[1.02] z-10" : "border-slate-200",
              )}
            >
              {tier.code === "pro" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-6 py-1.5 text-[10px] font-black text-white shadow-xl shadow-sky-200 uppercase tracking-widest">
                  Best for growing teams
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <p className={cn("text-xs font-black uppercase tracking-[0.2em]", tier.code === "pro" ? "text-sky-600" : "text-slate-400")}>
                    {tier.name}
                  </p>
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tighter text-slate-900">${currentPrice}</span>
                  <span className="text-sm font-bold text-slate-400">/mo</span>
                </div>
                {yearly && (
                  <p className="mt-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                    Billed annually at ${yearlyPrice}/yr
                  </p>
                )}

                <div className="mt-10 space-y-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 opacity-30">What you get</p>
                  <ul className="space-y-4">
                    {tier.features.map((feature: string) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <div className={cn("mt-1 rounded-full p-0.5", tier.code === "pro" ? "bg-sky-100 text-sky-600" : "bg-emerald-50 text-emerald-600")}>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-12">
                <Link
                  href="/signup"
                  className={cn(
                    "block w-full rounded-2xl py-4 text-center text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]",
                    tier.code === "pro" ? "bg-slate-900 text-white shadow-2xl shadow-slate-200 hover:bg-slate-800" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  Start {tier.name}
                </Link>
                <p className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                  Cancel anytime • Clear answers
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
