"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type GrowthChartProps = {
  data: Array<{ day: string; mrr: number }>;
};

export function GrowthChart({ data }: GrowthChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center animate-in fade-in zoom-in">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Waiting for data</div>
        <p className="text-sm text-slate-500">Connect a source to see your growth chart.</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="day" 
            stroke="#94a3b8" 
            tickLine={false} 
            axisLine={false} 
            fontSize={10} 
            fontWeight={700}
            dy={10}
            tickFormatter={(val) => val.toUpperCase()}
          />
          <YAxis 
            stroke="#94a3b8" 
            tickLine={false} 
            axisLine={false} 
            fontSize={10} 
            fontWeight={700}
            dx={-10}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey="mrr" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            fill="url(#chartGradient)" 
            animationDuration={1500}
            dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, fillOpacity: 1 }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl shadow-slate-950/20">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-sky-500" />
          <p className="text-sm font-bold text-white">${payload[0].value.toLocaleString()}</p>
        </div>
      </div>
    );
  }
  return null;
}
