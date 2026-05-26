"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Line } from "recharts";

type ChartData = {
  day: string;
  mrr: number;
  active_users: number;
  cac: number;
  ltv: number;
  anomaly_score?: number | null;
  anomaly_description?: string | null;
};

export function MrrChart({ data }: { data: ChartData[] }) {
  if (!data.length) return <EmptyChart />;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} dy={10} />
          <YAxis yAxisId="left" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
          <YAxis yAxisId="right" orientation="right" hide />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as ChartData;
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                    <p className="mb-2 text-sm font-semibold text-slate-900">{item.day}</p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-sky-600">MRR: ${item.mrr.toLocaleString()}</p>
                      {item.anomaly_score && (
                        <div className="mt-2 rounded bg-rose-50 p-2 border border-rose-100">
                          <p className="text-xs font-bold text-rose-600">Anomaly Detected ({item.anomaly_score}%)</p>
                          <p className="text-xs text-rose-700 mt-1">{item.anomaly_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area yAxisId="left" type="monotone" dataKey="mrr" stroke="#0ea5e9" strokeWidth={3} fill="url(#mrrFill)" animationDuration={1500} />
          <Bar yAxisId="right" dataKey="anomaly_score" fill="url(#anomalyGradient)" barSize={20} radius={[4, 4, 0, 0]} animationDuration={1500} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CacLtvChart({ data }: { data: ChartData[] }) {
  if (!data.length) return <EmptyChart />;

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ltvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="cacFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} dy={10} />
          <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(val) => `$${val}`} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          />
          <Bar dataKey="ltv" fill="url(#ltvFill)" radius={[4, 4, 0, 0]} barSize={15} animationDuration={1500} name="LTV" />
          <Bar dataKey="cac" fill="url(#cacFill)" radius={[4, 4, 0, 0]} barSize={15} animationDuration={1500} name="CAC" />
          <Line type="monotone" dataKey="cac" stroke="#f59e0b" strokeWidth={2} dot={false} animationDuration={1500} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
      No data available for the selected period.
    </div>
  );
}
