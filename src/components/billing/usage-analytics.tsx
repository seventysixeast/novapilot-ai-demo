"use client";

import { TrendingUp, Activity, Cpu, ArrowUpRight } from "lucide-react";

interface UsageMetric {
  name: string;
  used: number;
  allowed: number;
  unit: string;
  trend: number[];
}

export function UsageAnalytics({ metrics }: { metrics: UsageMetric[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => {
        const ratio = Math.min(100, (metric.used / metric.allowed) * 100);
        const isCritical = ratio > 90;
        
        return (
          <article key={metric.name} className="group relative overflow-hidden rounded-[1.5rem] bg-white border border-slate-200/60 p-6 transition-all duration-500 hover:border-sky-300/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{metric.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">{metric.used}</span>
                  <span className="text-xs font-bold text-slate-400">/ {metric.allowed === 999999 ? '∞' : metric.allowed}</span>
                </div>
              </div>
              <div className={`p-2 rounded-xl transition-colors ${isCritical ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 group-hover:bg-sky-50 group-hover:text-sky-600 text-slate-400'}`}>
                {metric.name.includes("AI") ? <Cpu className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out relative ${isCritical ? 'bg-rose-500' : 'bg-slate-900 group-hover:bg-sky-600'}`} 
                  style={{ width: `${ratio}%` }} 
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2s_infinite]" />
                </div>
              </div>
              
              {/* Premium Sparkline */}
              <div className="flex items-end gap-[2px] h-12 w-full opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                {metric.trend.map((val, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-[2px] transition-all duration-700 delay-[${i * 30}ms] ${isCritical ? 'bg-rose-200 group-hover:bg-rose-400' : 'bg-slate-200 group-hover:bg-sky-400'}`}
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span>SYSTEM NOMINAL</span>
              </div>
              <button className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                Detailed Logs <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

