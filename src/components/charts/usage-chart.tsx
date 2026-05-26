"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

type UsageChartProps = {
  points: Array<{ index: number; tokens: number }>;
};

export function UsageChart({ points }: UsageChartProps) {
  const data = points.length
    ? points
    : [
        { index: 1, tokens: 0 },
        { index: 2, tokens: 0 },
      ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="index" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #dbe3f0",
              borderRadius: "10px",
              color: "#0f172a",
            }}
          />
          <Area type="monotone" dataKey="tokens" stroke="#38bdf8" fill="url(#tokenFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
