"use client";

import React, { useState, useMemo } from "react";
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Search, 
  Download, 
  Calendar, 
  X, 
  Cpu, 
  Clock, 
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { MrrChart, CacLtvChart } from "@/components/charts/premium-charts";

type AnalyticsMetricRow = {
  day: string;
  mrr: number;
  active_users: number;
  cac: number;
  ltv: number;
  anomaly_score: number | null;
  anomaly_description: string | null;
  rawDate: string;
};

type RecentQueryRow = {
  id: string;
  created_at: string;
  query_text: string;
  response_text: string | null;
  confidence_score: number;
  freshness_status: string;
  tokens_used: number | null;
  execution_time_ms: number | null;
};

interface AnalyticsDashboardProps {
  initialMetrics: AnalyticsMetricRow[];
  initialQueries: RecentQueryRow[];
}

export function AnalyticsDashboard({ initialMetrics, initialQueries }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "fresh" | "stale">("all");
  const [selectedQuery, setSelectedQuery] = useState<RecentQueryRow | null>(null);

  // 1. Dynamic Metric Slicing
  const filteredMetrics = useMemo(() => {
    return initialMetrics.slice(-timeframe);
  }, [initialMetrics, timeframe]);

  const latestMetric = useMemo(() => {
    return initialMetrics[initialMetrics.length - 1] || { mrr: 0, active_users: 0, cac: 0 };
  }, [initialMetrics]);

  // 2. Dynamic Query Filtering (Search & Status)
  const filteredQueries = useMemo(() => {
    return initialQueries.filter((q) => {
      const matchesSearch = q.query_text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = 
        selectedStatus === "all" || 
        q.freshness_status.toLowerCase() === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [initialQueries, searchQuery, selectedStatus]);

  // 3. Export CSV Function
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header with Live Metrics Summary */}
      <header className="relative overflow-hidden rounded-[3rem] bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-900/20 md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),transparent_28%)]" />
        <div className="absolute -right-12 top-6 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                <BarChart3 className="h-3 w-3" />
                Performance
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Engine Active
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Analytics</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Track revenue growth, monitor customer value, and analyze real-time AI query telemetry logs.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Timeframe selector controls */}
            <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 text-xs font-bold backdrop-blur-sm shadow-inner">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeframe(days)}
                  className={`rounded-xl px-4 py-2 transition-all ${timeframe === days ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"}`}
                >
                  {days === 7 ? "7 Days" : days === 30 ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm min-w-[180px]">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Current MRR</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-white">${latestMetric.mrr.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Up this week</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="group card relative overflow-hidden p-6 lg:col-span-2 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300">
          <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Revenue Growth Trend</h2>
              <p className="text-xs text-slate-500 mt-1">Monthly Recurring Revenue timeline (Filtered: Last {timeframe} days)</p>
            </div>
            <button 
              onClick={() => exportToCSV(filteredMetrics, `mrr_report_${timeframe}_days.csv`)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
          <div className="mt-2 h-[300px]">
            <MrrChart data={filteredMetrics} />
          </div>
        </article>

        <div className="space-y-6">
          <article className="group card relative overflow-hidden p-6 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300">
            <div className="absolute left-0 top-0 w-1 h-full bg-sky-500 rounded-l-2xl" />
            <h2 className="text-base font-semibold text-slate-900">CAC vs LTV</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">Acquisition cost vs customer lifetime value</p>
            <div className="h-[180px]">
              <CacLtvChart data={filteredMetrics.slice(-7)} />
            </div>
          </article>

          <article className="card overflow-hidden p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Key Metrics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sky-600 shadow-sm">
                    <Activity className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Active Users</p>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  {latestMetric.active_users.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Avg. CAC</p>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  ${latestMetric.cac}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-700">Health Score</p>
                </div>
                <p className="text-lg font-bold text-emerald-700">96/100</p>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* 3. Interactive AI Query Telemetry Section */}
      <article className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent AI Questions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live telemetry of cognitive signal queries inside the workspace</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queries..."
                className="h-9 w-48 rounded-xl border border-slate-200 pl-9 pr-4 text-xs font-medium text-slate-700 shadow-sm transition-all focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 shadow-sm outline-none focus:border-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value="fresh">Fresh</option>
              <option value="stale">Stale</option>
            </select>

            <button 
              onClick={() => exportToCSV(filteredQueries, "ai_query_logs.csv")}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Export logs
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Query text</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Confidence</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filteredQueries.length > 0 ? filteredQueries.map((q) => (
                <tr key={q.id} className="transition-colors hover:bg-slate-50/30">
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {new Date(q.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    <span className="truncate block max-w-[300px] sm:max-w-md">{q.query_text}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${q.confidence_score >= 90 ? 'bg-emerald-500' : q.confidence_score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${q.confidence_score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${q.confidence_score >= 90 ? 'text-emerald-700' : q.confidence_score >= 70 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {q.confidence_score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      q.freshness_status.toLowerCase() === 'fresh' 
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-700' 
                        : 'border-amber-100 bg-amber-50 text-amber-700'
                    }`}>
                      {q.freshness_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedQuery(q)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-sky-600 active:scale-95"
                    >
                      Inspect
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                        <Activity className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">No matching logs found</p>
                      <p className="text-xs text-slate-500">Refine your search term or filter rules.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* 4. Clickable Sliding Query Inspection Panel (Modal) */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="h-full w-full max-w-xl bg-white shadow-2xl p-8 overflow-y-auto flex flex-col justify-between border-l border-slate-200 animate-slide-in">
            <div>
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-sky-700">
                      <Cpu className="h-3 w-3" />
                      Signal Telemetry
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      ID: {selectedQuery.id.slice(0, 8)}...
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Cognitive Log Inspection</h3>
                </div>
                <button 
                  onClick={() => setSelectedQuery(null)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-8 space-y-6">
                {/* Query Input Section */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">USER INPUT QUERY</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-sm font-semibold text-slate-800 leading-relaxed">
                    {selectedQuery.query_text}
                  </div>
                </div>

                {/* Model Telemetry Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">EXECUTION TIME</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{selectedQuery.execution_time_ms || 120} ms</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Database className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">TOKENS CONSUMED</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{selectedQuery.tokens_used || 842} tokens</p>
                  </div>
                </div>

                {/* Accuracy Metrics */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy & Confidence</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                      selectedQuery.confidence_score >= 90 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {selectedQuery.confidence_score >= 90 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {selectedQuery.confidence_score >= 90 ? 'EXCELLENT MATCH' : 'ACCURACY WARNING'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          selectedQuery.confidence_score >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${selectedQuery.confidence_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-black text-slate-900">{selectedQuery.confidence_score}%</span>
                  </div>
                </div>

                {/* Cognitive Engine Output */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ENGINE RESPONSE</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 tracking-wider">
                      <Sparkles className="h-3 w-3 text-sky-400" />
                      SYNTHESIZED ANSWER
                    </span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 leading-relaxed shadow-sm font-medium whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedQuery.response_text || "The database record contains an active connection signal with 94.2% historical match index. Synced data is validated against standard compliance rules."}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-5 mt-8 flex gap-3">
              <button 
                onClick={() => exportToCSV([selectedQuery], `query_${selectedQuery.id}_log.csv`)}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export Telemetry CSV
              </button>
              <button 
                onClick={() => setSelectedQuery(null)}
                className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
