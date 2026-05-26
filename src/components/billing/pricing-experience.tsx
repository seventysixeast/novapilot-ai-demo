"use client";

import { Check, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PRICING_PLANS } from "@/lib/billing/plans";

export function PricingExperience({ isInternalTester }: { isInternalTester?: boolean }) {
  const [yearly, setYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");

  const plans = useMemo(() => [
    { code: 'basic', ...PRICING_PLANS.basic },
    { code: 'pro', ...PRICING_PLANS.pro },
    { code: 'enterprise', ...PRICING_PLANS.enterprise },
  ], []);

  return (
    <section className="space-y-12">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
          <Zap className="h-3 w-3 text-sky-400" />
          Intelligence Provisioning
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Strategic Intelligence Matrix</h2>
        <p className="text-slate-500 max-w-xl font-medium">Select the optimal signal processing tier for your organizational requirements.</p>
        
        <div className="pt-4">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5 text-xs font-bold shadow-sm">
            <button
              className={cn(
                "rounded-xl px-6 py-2 transition-all",
                !yearly ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"
              )}
              onClick={() => setYearly(false)}
            >
              Monthly
            </button>
            <button
              className={cn(
                "rounded-xl px-6 py-2 transition-all flex items-center gap-2",
                yearly ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"
              )}
              onClick={() => setYearly(true)}
            >
              Annual
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-black text-sky-700">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3 pt-8">
        {plans.map((plan) => {
          const price = yearly ? Math.round(plan.price * 0.8 * 12) : plan.price;
          const isSelected = plan.code === selectedPlan;
          
          return (
            <article
              key={plan.code}
              onClick={() => setSelectedPlan(plan.code)}
              className={cn(
                "relative flex flex-col justify-between rounded-[2.5rem] border p-8 transition-all duration-500 cursor-pointer",
                isSelected 
                  ? "bg-slate-900 text-white border-slate-800 shadow-[0_40px_80px_-15px_rgba(15,23,42,0.3)] scale-[1.02] z-10" 
                  : "bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100 opacity-90 hover:opacity-100"
              )}
            >
              <div>
                {isSelected && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-sky-500 px-4 py-1 text-[10px] font-black text-white shadow-xl shadow-sky-500/20 uppercase tracking-widest">
                    <Sparkles className="h-3.5 w-3.5" />
                    Selected Choice
                  </div>
                )}
                
                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em]", isSelected ? "text-sky-400" : "text-slate-400")}>
                  {plan.name} Tier
                </p>
                
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tighter">${price.toFixed(0)}</span>
                  <span className={cn("text-xs font-bold", isSelected ? "text-white/40" : "text-slate-400")}>
                    {yearly ? "/ year" : "/ month"}
                  </span>
                </div>
                {yearly && (
                  <p className={cn("mt-2 text-[10px] font-semibold uppercase tracking-wider", isSelected ? "text-sky-200" : "text-slate-500")}>
                    (Equal to ${(plan.price * 0.8).toFixed(2)} / month)
                  </p>
                )}
                
                <div className="mt-10 space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm font-medium">
                      <div className={cn("mt-1 rounded-full p-0.5", isSelected ? "bg-sky-500/20 text-sky-400" : "bg-emerald-50 text-emerald-600")}>
                        <Check className="h-3 w-3" strokeWidth={4} />
                      </div>
                      <span className={isSelected ? "text-white/80" : "text-slate-600"}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link 
                href={`/dashboard/billing/checkout?plan=${plan.code}&interval=${yearly ? 'annual' : 'monthly'}`}
                className={cn(
                  "mt-12 block w-full rounded-2xl py-4 text-center text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-[0.98]",
                  isSelected
                    ? "bg-sky-500 text-white shadow-xl shadow-sky-500/20 hover:bg-sky-400"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                {`Deploy ${plan.name} Intelligence`}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
