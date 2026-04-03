import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ListenerRecord } from "../types";

interface ListenerChartProps {
  records: ListenerRecord[];
}

const COLORS = {
  spotify: "#1db954",
  youtube: "#ff0000",
};

function formatAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}

export function ListenerChart({ records }: ListenerChartProps) {
  if (records.length === 0) {
    return <div className="chart-empty">データがありません</div>;
  }

  const hasYoutube = records.some((r) => r.youtube_subscribers != null);

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
            tickFormatter={formatAxis}
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
            formatter={(value, name) => {
              const label = name === "monthly_listeners" ? "Spotify" : "YouTube";
              return [Number(value).toLocaleString("en-US"), label];
            }}
            labelStyle={{ color: "#4a5568", marginBottom: 4, fontSize: 11 }}
          />
          {hasYoutube && (
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) =>
                value === "monthly_listeners" ? "Spotify Listeners" : "YouTube Subscribers"
              }
              wrapperStyle={{ fontSize: 12, color: "#7a8599" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="monthly_listeners"
            name="monthly_listeners"
            stroke={COLORS.spotify}
            strokeWidth={2}
            dot={false}
            activeDot={{ fill: COLORS.spotify, r: 4, stroke: "#0d1321", strokeWidth: 2 }}
          />
          {hasYoutube && (
            <Line
              type="monotone"
              dataKey="youtube_subscribers"
              name="youtube_subscribers"
              stroke={COLORS.youtube}
              strokeWidth={2}
              dot={false}
              activeDot={{ fill: COLORS.youtube, r: 4, stroke: "#0d1321", strokeWidth: 2 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
