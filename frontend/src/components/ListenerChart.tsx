import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import type { ListenerRecord, Annotation } from "../types";

interface ListenerChartProps {
  records: ListenerRecord[];
  annotations?: Annotation[];
}

const COLORS = {
  spotify: "#1db954",
  youtube: "#ff0000",
};

const CATEGORY_COLORS: Record<string, string> = {
  release: "#f6ad55",
  viral: "#fc8181",
  collab: "#90cdf4",
  tour: "#9ae6b4",
  award: "#fefcbf",
  other: "#a0aec0",
};

function formatAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}

export function ListenerChart({ records, annotations }: ListenerChartProps) {
  if (records.length === 0) {
    return <div className="chart-empty">データがありません</div>;
  }

  const hasYoutube = records.some((r) => r.youtube_subscribers != null);
  const dates = records.map((r) => r.date);

  // アノテーションをレコードの日付範囲内でフィルタ
  const visibleAnnotations = annotations?.filter((a) => dates.includes(a.date)) ?? [];

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
          {visibleAnnotations.map((ann) => {
            const color = CATEGORY_COLORS[ann.category] ?? CATEGORY_COLORS.other;
            return (
              <ReferenceLine
                key={`${ann.date}-${ann.title}`}
                x={ann.date}
                stroke={color}
                strokeDasharray="3 3"
                strokeWidth={1}
                strokeOpacity={0.4}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      {visibleAnnotations.length > 0 && (
        <div className="chart-annotations-bar">
          {visibleAnnotations.map((ann, i) => {
            const color = CATEGORY_COLORS[ann.category] ?? CATEGORY_COLORS.other;
            return (
              <span key={`${ann.date}-${ann.title}`} className="chart-annotation-marker">
                <span className="chart-annotation-num" style={{ backgroundColor: color }}>
                  {i + 1}
                </span>
                <span className="chart-annotation-date">{ann.date}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
