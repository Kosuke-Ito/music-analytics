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
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={records}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={(v: number) => v.toLocaleString("en-US")}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f1520",
              border: "1px solid #1a1f2e",
              borderRadius: 8,
              color: "#e5e7eb",
            }}
            formatter={(value) => [Number(value).toLocaleString("en-US"), "Monthly Listeners"]}
          />
          <Line
            type="monotone"
            dataKey="monthly_listeners"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: "#3B82F6", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
