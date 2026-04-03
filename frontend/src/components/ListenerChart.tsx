import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ListenerRecord } from "../types";

interface ListenerChartProps {
  records: ListenerRecord[];
}

export function ListenerChart({ records }: ListenerChartProps) {
  if (records.length === 0) {
    return <div className="chart-empty">データがありません</div>;
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={records} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
            tickFormatter={(v: number) => {
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
              return v.toString();
            }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
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
            formatter={(value) => [Number(value).toLocaleString("en-US"), "Listeners"]}
            labelStyle={{ color: "#4a5568", marginBottom: 4, fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="monthly_listeners"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{
              fill: "#3b82f6",
              r: 4,
              stroke: "#0d1321",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
