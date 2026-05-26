import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/server/tenant";
import { GrowthAgent } from "@/lib/ai/agents";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { redirect } from "next/navigation";

export default async function InsightsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const supabase = await createClient();

  const agent = new GrowthAgent(membership.organizationId);

  const { data: analytics } = await supabase
    .from("analytics_metrics")
    .select("metric_date, mrr, active_users, cac, ltv, anomaly_score, anomaly_description")
    .eq("organization_id", membership.organizationId)
    .order("metric_date", { ascending: false })
    .limit(10);

  const analyticsRows = analytics ?? [];

  const dataContext = analyticsRows.length
    ? analyticsRows
        .slice()
        .reverse()
        .map((metric) => {
          const anomaly = metric.anomaly_description ? `Anomaly: ${metric.anomaly_description}` : "Anomaly: none";
          return [
            `Date: ${metric.metric_date}`,
            `MRR: $${Number(metric.mrr).toLocaleString()}`,
            `Active Users: ${metric.active_users}`,
            `CAC: $${Number(metric.cac).toLocaleString()}`,
            `LTV: $${Number(metric.ltv).toLocaleString()}`,
            `Signal Health: ${metric.anomaly_score ?? "n/a"}`,
            anomaly,
          ].join(" | ");
        })
        .join("\n")
    : "No analytics data yet. Connect a source and ask your first question to get started.";

  const analysis = await agent.analyzeGrowth(dataContext);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-sky-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-sky-600">Insights ready</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Strategic Insights</h1>
        <p className="mt-2 text-slate-500 max-w-2xl text-lg">
          NovaPilot highlights what changed, what looks risky, and what to do next.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary Card */}
        <article className="lg:col-span-2 card p-8 bg-gradient-to-br from-white to-sky-50/30 border-sky-100 shadow-xl shadow-sky-900/5">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Summary</h2>
          </div>
          <p className="text-slate-700 leading-relaxed text-lg italic border-l-4 border-sky-400 pl-6 py-2">
            &ldquo;{analysis.summary}&rdquo;
          </p>
        </article>

        {/* Anomaly Detection */}
        <article className="card p-8 border-amber-100 bg-amber-50/20">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="text-xl font-bold text-slate-900">Alerts</h2>
          </div>
          <div className="space-y-4">
            {analysis.anomalies.length ? analysis.anomalies.map((a, i) => (
              <div key={i} className="flex gap-3 text-sm text-slate-700 font-medium bg-white/60 p-3 rounded-xl border border-amber-100">
                <span className="text-amber-500">-</span>
                {a}
              </div>
            )) : (
              <p className="text-sm text-slate-500">Nothing urgent right now.</p>
            )}
          </div>
        </article>
      </div>

      {/* Recommendations */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-emerald-500" />
          <h2 className="text-2xl font-bold text-slate-900">Recommended next steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analysis.recommendations.map((r, i) => (
            <article key={i} className="card p-6 hover:border-emerald-200 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 font-black group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                0{i + 1}
              </div>
              <p className="text-slate-800 font-bold leading-snug">{r}</p>
              <button className="mt-6 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">
                Open
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
