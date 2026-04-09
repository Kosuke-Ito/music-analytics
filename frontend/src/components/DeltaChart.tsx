import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { ListenerRecord } from "../types";

interface DeltaChartProps {
  records: ListenerRecord[];
}

function formatAxis(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "+";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${abs}`;
}

export function DeltaChart({ records }: DeltaChartProps) {
  const data = useMemo(() => {
    if (records.length < 2) return [];
    return records.slice(1).map((r, i) => ({
      date: r.date,
      delta: r.monthly_listeners - records[i].monthly_listeners,
    }));
  }, [records]);

  if (data.length === 0) return null;

  return (
    <div className="chart-section">
      <span className="chart-section-title">Daily Change (Spotify)</span>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#151d2e" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ fill: "#4a5568", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "#4a5568", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickFormatter={formatAxis}
              tickLine={false}
              axisLine={false}
              width={52}
              domain={["auto", "auto"]}
            />
            <ReferenceLine y={0} stroke="#4a5568" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d1321",
                border: "1px solid #1e2d47",
                borderRadius: 8,
                color: "#e8eaed",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                padding: "10px 14px",
              }}
              formatter={(value) => [
                `${Number(value) >= 0 ? "+" : ""}${Number(value).toLocaleString("en-US")}`,
                "Change",
              ]}
              labelStyle={{ color: "#4a5568", marginBottom: 4, fontSize: 11 }}
            />
            <Bar dataKey="delta" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.delta >= 0 ? "#34d399" : "#f87171"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
