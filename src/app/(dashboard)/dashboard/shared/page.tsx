import { Share2, ArrowUpRight, Clock, Shield, TrendingUp, Sparkles, Users } from "lucide-react";
import Link from "next/link";

type SharedInsight = {
  id: string;
  title: string;
  summary: string;
  author: string;
  sharedAt: string;
  type: "growth" | "anomaly" | "recommendation";
  views: number;
  confidence: number;
};

const SHARED_INSIGHTS: SharedInsight[] = [
  {
    id: "1",
    title: "MRR Inflection Point Analysis",
    summary: "Analysis of the 12% week-over-week growth event, tracing the driver to the new enterprise onboarding flow deployed May 1st.",
    author: "Growth Agent",
    sharedAt: "2 hours ago",
    type: "growth",
    views: 34,
    confidence: 94,
  },
  {
    id: "2",
    title: "Churn Risk: Enterprise Cohort",
    summary: "3 enterprise accounts flagged with 40%+ login frequency drops over 14 days. Immediate outreach recommended.",
    author: "Anomaly Engine",
    sharedAt: "Yesterday",
    type: "anomaly",
    views: 18,
    confidence: 87,
  },
  {
    id: "3",
    title: "Q2 Strategic Recommendations",
    summary: "Top 3 AI-synthesized recommendations: reduce CAC via improved activation, double down on enterprise tier, optimize weekly digest.",
    author: "Strategy Agent",
    sharedAt: "3 days ago",
    type: "recommendation",
    views: 52,
    confidence: 91,
  },
];

const TYPE_CONFIG = {
  growth: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", label: "Growth Signal" },
  anomaly: { icon: Shield, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", label: "Anomaly Alert" },
  recommendation: { icon: Sparkles, color: "text-sky-600", bg: "bg-sky-50 border-sky-100", label: "Recommendation" },
};

export default function SharedInsightsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Collaboration Hub</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Shared Insights</h1>
          <p className="text-slate-500 leading-relaxed">AI-synthesized intelligence shared across your team for collaborative review.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{SHARED_INSIGHTS.length} Active Shares</span>
          </div>
        </div>
      </header>

      {/* Insights Grid */}
      <div className="space-y-4">
        {SHARED_INSIGHTS.map((insight, i) => {
          const config = TYPE_CONFIG[insight.type];
          const Icon = config.icon;
          return (
            <article
              key={insight.id}
              className="card p-7 hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-start gap-6">
                <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {insight.sharedAt}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors">{insight.title}</h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{insight.summary}</p>
                  <div className="flex items-center gap-5 mt-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <Sparkles className="h-3 w-3" />
                      <span>By {insight.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <Users className="h-3 w-3" />
                      <span>{insight.views} views</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Confidence</p>
                    <p className={`text-2xl font-black ${insight.confidence >= 90 ? "text-emerald-600" : "text-sky-600"}`}>
                      {insight.confidence}%
                    </p>
                  </div>
                  <Link
                    href="/dashboard/insights"
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
                  >
                    View <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
