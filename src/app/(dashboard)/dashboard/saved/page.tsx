import { Bookmark, ArrowUpRight, Clock, TrendingUp, Shield, Sparkles, Download, Trash2 } from "lucide-react";
import Link from "next/link";

type SavedReport = {
  id: string;
  title: string;
  summary: string;
  savedAt: string;
  type: "chart" | "query" | "review";
  size: string;
};

const SAVED_REPORTS: SavedReport[] = [
  {
    id: "1",
    title: "MRR Trend Report - Week 18",
    summary: "7-day rolling MRR performance with anomaly highlights. Includes growth velocity calculations and projection to end of month.",
    savedAt: "Today, 10:32 AM",
    type: "chart",
    size: "2.4 KB",
  },
  {
    id: "2",
    title: "Weekly Growth Review #14",
    summary: "Autonomous strategic review covering MRR, CAC, LTV, activation rate, and churn analysis for the week of May 5-11.",
    savedAt: "Yesterday",
    type: "review",
    size: "8.1 KB",
  },
  {
    id: "3",
    title: "Q1 CAC vs LTV Analysis",
    summary: "Deep-dive intelligence query synthesizing customer acquisition cost against lifetime value across all acquisition channels.",
    savedAt: "May 3, 2026",
    type: "query",
    size: "3.7 KB",
  },
  {
    id: "4",
    title: "Activation Funnel Breakdown",
    summary: "Precision analytics report showing drop-off points in the onboarding flow with AI-recommended intervention points.",
    savedAt: "April 28, 2026",
    type: "chart",
    size: "5.2 KB",
  },
];

const TYPE_CONFIG = {
  chart: { icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-50 border-sky-100", label: "Chart Export" },
  query: { icon: Sparkles, color: "text-violet-600", bg: "bg-violet-50 border-violet-100", label: "AI Query" },
  review: { icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", label: "Growth Review" },
};

export default function SavedReportsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-20">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Report Archive</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Saved Reports</h1>
          <p className="text-slate-500 leading-relaxed">Your archived intelligence reports, AI queries, and growth reviews.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 transition-all hover:bg-sky-500"
          >
            New Report <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Saved", value: SAVED_REPORTS.length, color: "text-slate-900" },
          { label: "This Month", value: 2, color: "text-sky-600" },
          { label: "Storage Used", value: "19.4 KB", color: "text-emerald-600" },
        ].map((stat) => (
          <article key={stat.label} className="card p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </article>
        ))}
      </div>

      <article className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div className="flex items-center gap-3">
            <Bookmark className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Archived Reports</h2>
          </div>
          <span className="rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {SAVED_REPORTS.length} reports
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {SAVED_REPORTS.map((report) => {
            const config = TYPE_CONFIG[report.type];
            const Icon = config.icon;

            return (
              <div key={report.id} className="group flex items-center gap-6 px-8 py-5 transition-all hover:bg-slate-50/50">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-slate-900">{report.title}</h3>
                    <span className={`shrink-0 rounded border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-xs text-slate-500">{report.summary}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock className="h-2.5 w-2.5" /> {report.savedAt} - {report.size}
                  </p>
                </div>

                <div className="flex items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    title="Download"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    title="Remove"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    href="/dashboard/analytics"
                    className="flex h-9 items-center gap-1 rounded-xl bg-slate-100 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-900 hover:text-white"
                  >
                    Open <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}
