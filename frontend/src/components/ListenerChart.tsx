import { useMemo } from "react";
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

type ChartRow = ListenerRecord & { listeners_ma7: number };

interface ListenerChartProps {
  records: ListenerRecord[];
  annotations?: Annotation[];
}

const COLORS = {
  spotify: "#1db954",
  youtube: "#ff0000",
  ma7: "#38bdf8",
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
  const chartData = useMemo<ChartRow[]>(() => {
    return records.map((r, i) => {
      const start = Math.max(0, i - 6);
      const slice = records.slice(start, i + 1);
      const ma = slice.reduce((s, x) => s + x.monthly_listeners, 0) / slice.length;
      return { ...r, listeners_ma7: Math.round(ma) };
    });
  }, [records]);

  if (records.length === 0) {
    return <div className="chart-empty">データがありません</div>;
  }

  const hasYoutube = records.some((r) => r.youtube_subscribers != null);
  const showMa7 = records.length >= 2;
  const dates = records.map((r) => r.date);
  const showLegend = hasYoutube || showMa7;

  const visibleAnnotations = annotations?.filter((a) => dates.includes(a.date)) ?? [];

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
              const v = Number(value).toLocaleString("en-US");
              if (name === "monthly_listeners") return [v, "Spotify listeners"];
              if (name === "listeners_ma7") return [v, "Spotify 7d MA"];
              if (name === "youtube_subscribers") return [v, "YouTube subs"];
              return [v, String(name)];
            }}
            labelStyle={{ color: "#4a5568", marginBottom: 4, fontSize: 11 }}
          />
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                if (value === "monthly_listeners") return "Spotify Listeners";
                if (value === "listeners_ma7") return "Spotify 7d MA";
                if (value === "youtube_subscribers") return "YouTube Subscribers";
                return String(value);
              }}
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
          {showMa7 && (
            <Line
              type="monotone"
              dataKey="listeners_ma7"
              name="listeners_ma7"
              stroke={COLORS.ma7}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ fill: COLORS.ma7, r: 3, stroke: "#0d1321", strokeWidth: 2 }}
            />
          )}
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
