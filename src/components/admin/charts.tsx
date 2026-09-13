"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatNaira } from "@/lib/utils";

export function VotesByCategoryChart({
  data,
}: {
  data: Array<{ name: string; votes: number }>;
}) {
  const colors = ["#b70515", "#6d8d00", "#ee6108", "#efaf0b", "#2d4283", "#8fae1a", "#ec5668"];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={54} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e7f0", fontSize: 13 }}
        />
        <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueByDayChart({
  data,
}: {
  data: Array<{ day: string; kobo: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `₦${Math.round(v / 1000)}k`}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          formatter={(value) => [formatNaira(Number(value)), "Approved value"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e7f0", fontSize: 13 }}
        />
        <Bar dataKey="kobo" fill="#6d8d00" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-navy-400">{label}</p>
        {icon}
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold text-navy-950">{value}</p>
      {sub ? <p className="mt-1 text-xs text-navy-500">{sub}</p> : null}
    </div>
  );
}
