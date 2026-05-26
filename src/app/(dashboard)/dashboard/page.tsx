import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";
import { TrendingUp, ShieldCheck, Zap, ArrowUpRight, AlertCircle, Clock } from "lucide-react";
import { GrowthChart } from "@/components/charts/growth-chart";
import { AIQuickInsight } from "@/components/dashboard/ai-quick-insight";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentType } from "react";

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  const supabase = await createClient();

  let trustHealth = { avgConfidence: 0, lowConfidenceCount: 0, queryCount: 0 };
  let staleConnectors = 0;
  let weeklyReviewCount = 0;
  let latestAlerts: Array<{ title: string; level: "warning" | "critical" | "info" }> = [];
  let chartData: Array<{ day: string; mrr: number }> = [];
  let growthPercent = "0.0";

  if (membership) {
    const [{ data: queries }, { data: connections }, { data: reviews }, { data: analytics }] = await Promise.all([
      supabase
        .from("ai_queries")
        .select("confidence_score")
        .eq("organization_id", membership.organizationId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("data_connections")
        .select("provider, last_synced_at, status")
        .eq("organization_id", membership.organizationId),
      supabase
        .from("weekly_growth_reviews")
        .select("id")
        .eq("organization_id", membership.organizationId)
        .order("generated_for_week", { ascending: false })
        .limit(4),
      supabase
        .from("analytics_metrics")
        .select("metric_date, mrr")
        .eq("organization_id", membership.organizationId)
        .order("metric_date", { ascending: true })
        .limit(7),
    ]);

    const queryRows = (queries ?? []) as Array<{ confidence_score: number }>;
    const avgConfidence =
      queryRows.length > 0
        ? Math.round(queryRows.reduce((sum, row) => sum + row.confidence_score, 0) / queryRows.length)
        : 0;
    trustHealth = {
      avgConfidence,
      lowConfidenceCount: queryRows.filter((row) => row.confidence_score < 60).length,
      queryCount: queryRows.length,
    };

    const connectionRows = (connections ?? []) as Array<{
      provider: string;
      last_synced_at: string | null;
      status: "connected" | "syncing" | "error" | "disconnected";
    }>;
    staleConnectors = connectionRows.filter((connection) => {
      if (!connection.last_synced_at) return true;
      return connection.status !== "connected";
    }).length;
    weeklyReviewCount = (reviews ?? []).length;

    latestAlerts = [
      ...(staleConnectors > 0
        ? [{ title: `${staleConnectors} data pipeline(s) require re-sync`, level: "warning" as const }]
        : []),
      ...(trustHealth.lowConfidenceCount > 0
        ? [{ title: `${trustHealth.lowConfidenceCount} anomalous signals detected`, level: "critical" as const }]
        : []),
      ...(weeklyReviewCount > 0 ? [{ title: `${weeklyReviewCount} strategic reviews finalized`, level: "info" as const }] : []),
    ];

    const metrics = (analytics ?? []) as Array<{ metric_date: string; mrr: number }>;
    if (metrics.length > 0) {
      chartData = metrics.map(m => ({
        day: new Date(m.metric_date).toLocaleDateString('en-US', { weekday: 'short' }),
        mrr: Number(m.mrr),
      }));
      
      if (metrics.length >= 2) {
        const latest = metrics[metrics.length - 1].mrr;
        const previous = metrics[0].mrr;
        const growth = ((latest - previous) / previous) * 100;
        growthPercent = growth.toFixed(1);
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Hero Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 bg-sky-50 px-2 py-1 rounded-md">Overview</span>
            <span className="text-[10px] font-bold text-slate-400">Live workspace</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
            See growth, alerts, and next steps at a glance.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Freshness</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-sm font-bold text-slate-900">100% Calibrated</span>
            </div>
          </div>
          <button className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <Clock className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* AI Pulse */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
        <article className="relative card p-6 bg-white/80 backdrop-blur-md">
          <AIQuickInsight userContext={`Growth: ${growthPercent}%, Confidence: ${trustHealth.avgConfidence}%`} />
        </article>
      </div>

      {/* Top Level KPIs */}
      <section className="grid gap-6 md:grid-cols-3">
        <KPICard 
          title="Revenue Velocity" 
          value={`$${(chartData[chartData.length-1]?.mrr || 0).toLocaleString()}`} 
          trend={`${growthPercent}%`} 
          icon={TrendingUp} 
          subtitle="Monthly Recurring Revenue"
        />
        <KPICard 
          title="Answer quality" 
          value={`${trustHealth.avgConfidence}%`} 
          trend="Nominal" 
          icon={ShieldCheck} 
          subtitle="How confident the AI is"
        />
        <KPICard 
          title="Questions asked" 
          value={trustHealth.queryCount} 
          trend="+12" 
          icon={Zap} 
          subtitle="Recent AI conversations"
        />
      </section>

      {/* Main Analysis Area */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Growth Chart */}
        <article className="lg:col-span-2 card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Growth over time</h2>
              <p className="text-sm text-slate-500 mt-1">Your revenue trend for the last 7 days</p>
            </div>
            <Link href="/dashboard/analytics" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl hover:bg-sky-500 hover:text-white transition-all">
              Full Analytics <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-[300px]">
            <GrowthChart data={chartData} />
          </div>
        </article>

        {/* Strategic Alerts */}
          <article className="card flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Alerts</h2>
            <p className="text-xs text-slate-500 mt-1">Things that need attention</p>
            </div>
          <div className="flex-1 p-6 space-y-4">
            {latestAlerts.length ? latestAlerts.map((alert, i) => (
              <div key={i} className={cn(
                "flex items-start gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02]",
                alert.level === "critical" ? "bg-rose-50/50 border-rose-100 text-rose-700" :
                alert.level === "warning" ? "bg-amber-50/50 border-amber-100 text-amber-700" :
                "bg-sky-50/50 border-sky-100 text-sky-700"
              )}>
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-bold leading-snug">{alert.title}</span>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <ShieldCheck className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">All Systems Nominal</p>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-slate-100">
            <Link href="/dashboard/notifications" className="block w-full py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
              View History
            </Link>
          </div>
        </article>
      </div>

      {/* Operational Matrix */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Operational Matrix</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <MatrixLink href="/dashboard/chat" title="Ask AI" desc="Ask a question" color="sky" />
          <MatrixLink href="/dashboard/insights" title="Insights" desc="See what matters" color="indigo" />
          <MatrixLink href="/dashboard/connectors" title="Data sources" desc="Connect your tools" color="emerald" />
          <MatrixLink href="/dashboard/settings" title="Settings" desc="Manage your account" color="slate" />
        </div>
      </section>
    </div>
  );
}

type KPICardProps = {
  title: string;
  value: string | number;
  trend: string;
  icon: ComponentType<{ className?: string }>;
  subtitle: string;
};

function KPICard({ title, value, trend, icon: Icon, subtitle }: KPICardProps) {
  return (
    <article className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
          <ArrowUpRight className="h-3 w-3" />
          <span className="text-[10px] font-black">{trend}</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        <p className="text-[11px] font-bold text-slate-500 mt-1">{subtitle}</p>
      </div>
    </article>
  );
}

type MatrixLinkProps = {
  href: string;
  title: string;
  desc: string;
  color: "sky" | "indigo" | "emerald" | "slate";
};

function MatrixLink({ href, title, desc, color }: MatrixLinkProps) {
  const colors: Record<string, string> = {
    sky: "bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-500",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-500",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500",
    slate: "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-900",
  };

  return (
    <a href={href} className={cn(
      "group card p-5 flex flex-col gap-3 transition-all hover:border-sky-200"
    )}>
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-300",
        colors[color] || colors.slate,
        "group-hover:text-white"
      )}>
        <Zap className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </a>
  );
}
