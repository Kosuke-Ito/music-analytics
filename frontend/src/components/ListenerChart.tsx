import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Label,
} from "recharts";
import type { ListenerRecord, Annotation } from "../types";
import { formatCompact, formatDeltaCompact } from "../utils/format";
import { CATEGORY_COLORS } from "../constants/annotation";
import { TOOLTIP_STYLE, CHART_COLORS as COLORS, GRID_STROKE, TICK_STYLE, LABEL_STYLE, ACTIVE_DOT_STROKE } from "../constants/chart";

type MetricKey =
  | "spotify_listeners"
  | "spotify_followers"
  | "yt_subscribers"
  | "yt_views"
  | "ytm_listeners"
  | "ytm_subscribers";

interface MetricDef {
  key: MetricKey;
  label: string;
  shortLabel: string;
  field: keyof ListenerRecord;
  color: string;
}

interface ListenerChartProps {
  records: ListenerRecord[];
  visibleAnnotations: Annotation[];
  hoveredAnnotation: number | null;
  onHoverAnnotation: (index: number | null) => void;
}

const ALL_METRICS: MetricDef[] = [
  { key: "spotify_listeners", label: "Spotify Listeners", shortLabel: "Spotify ML", field: "monthly_listeners", color: COLORS.spotify },
  { key: "spotify_followers", label: "Spotify Followers", shortLabel: "Spotify Fol", field: "spotify_followers" as keyof ListenerRecord, color: "#1ed760" },
  { key: "yt_subscribers", label: "YouTube Subscribers", shortLabel: "YT Subs", field: "youtube_subscribers" as keyof ListenerRecord, color: COLORS.youtube },
  { key: "yt_views", label: "YouTube Total Views", shortLabel: "YT Views", field: "youtube_total_views" as keyof ListenerRecord, color: "#ff4444" },
  { key: "ytm_listeners", label: "YT Music Listeners", shortLabel: "YTM ML", field: "ytm_monthly_listeners" as keyof ListenerRecord, color: "#ff0050" },
  { key: "ytm_subscribers", label: "YT Music Subscribers", shortLabel: "YTM Subs", field: "ytm_subscribers" as keyof ListenerRecord, color: "#ff6688" },
];

export function ListenerChart({ records, visibleAnnotations, hoveredAnnotation, onHoverAnnotation }: ListenerChartProps) {
  const availableMetrics = useMemo(() => {
    return ALL_METRICS.filter((m) =>
      records.some((r) => (r[m.field] as number | undefined) != null),
    );
  }, [records]);

  const [metricKey, setMetricKey] = useState<MetricKey>("spotify_listeners");
  const metric = availableMetrics.find((m) => m.key === metricKey) ?? availableMetrics[0];

  const chartData = useMemo(() => {
    if (!metric) return [];
    return records.map((r, i) => {
      const value = r[metric.field] as number | undefined;
      const prevValue = i > 0 ? (records[i - 1][metric.field] as number | undefined) : undefined;
      const delta = value != null && prevValue != null ? value - prevValue : null;

      // 7d MA (Spotify Listeners のみ)
      let ma7: number | null = null;
      if (metric.key === "spotify_listeners") {
        const start = Math.max(0, i - 6);
        const slice = records.slice(start, i + 1).map((x) => x.monthly_listeners).filter((v) => v != null);
        if (slice.length > 0) ma7 = Math.round(slice.reduce((s, v) => s + v, 0) / slice.length);
      }

      return {
        date: r.date,
        value: value ?? null,
        ma7,
        delta,
      };
    });
  }, [records, metric]);

  const hasDelta = records.length >= 2;
  const showMA7 = metric?.key === "spotify_listeners";

  if (records.length === 0) {
    return <div className="chart-empty">データがありません</div>;
  }

  return (
    <div className="chart-container chart-container--main">
      {availableMetrics.length > 1 && (
        <div className="range-filter range-filter--wrap" style={{ marginBottom: 12 }}>
          {availableMetrics.map((m) => (
            <button
              key={m.key}
              className={`range-btn ${metricKey === m.key ? "range-btn--active" : ""}`}
              onClick={() => setMetricKey(m.key)}
            >
              {m.shortLabel}
            </button>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 50, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="date"
            stroke="transparent"
            tick={{ ...TICK_STYLE, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            stroke="transparent"
            tick={{ ...TICK_STYLE, fontSize: 11 }}
            tickFormatter={formatCompact}
            tickLine={false}
            axisLine={false}
            width={52}
            domain={[(d: number) => Math.floor(d * 0.95), (d: number) => Math.ceil(d * 1.05)]}
          />
          {hasDelta && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="transparent"
              tick={{ ...TICK_STYLE, fontSize: 10 }}
              tickFormatter={formatDeltaCompact}
              tickLine={false}
              axisLine={false}
              width={52}
            />
          )}
          <Tooltip
            contentStyle={{ ...TOOLTIP_STYLE, fontSize: 12, padding: "10px 14px" }}
            formatter={(value, name) => {
              const v = Number(value);
              const formatted = v.toLocaleString("en-US");
              if (name === "value") return [formatted, metric?.label ?? ""];
              if (name === "ma7") return [formatted, "7d MA"];
              if (name === "delta") return [formatted, "Daily Change"];
              return [formatted, String(name)];
            }}
            labelStyle={LABEL_STYLE}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              if (value === "value") return metric?.label ?? "";
              if (value === "ma7") return "7d MA";
              if (value === "delta") return "Daily Change";
              return value;
            }}
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
          {hasDelta && (
            <Bar yAxisId="right" dataKey="delta" barSize={12} radius={[3, 3, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={Number(entry.delta) >= 0 ? COLORS.deltaUp : COLORS.deltaDown}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          )}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            stroke={metric?.color ?? COLORS.spotify}
            strokeWidth={2}
            dot={false}
            activeDot={{ fill: metric?.color ?? COLORS.spotify, r: 4, stroke: ACTIVE_DOT_STROKE, strokeWidth: 2 }}
            connectNulls
          />
          {showMA7 && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="ma7"
              stroke={COLORS.ma7}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ fill: COLORS.ma7, r: 3, stroke: ACTIVE_DOT_STROKE, strokeWidth: 2 }}
              connectNulls
            />
          )}
          {(() => {
            const dateSlotIndex = new Map<string, number>();
            const dateSlotCount = new Map<string, number>();
            visibleAnnotations.forEach((a) => {
              dateSlotCount.set(a.date, (dateSlotCount.get(a.date) ?? 0) + 1);
            });

            return visibleAnnotations.map((ann, i) => {
              const color = CATEGORY_COLORS[ann.category] ?? CATEGORY_COLORS.other;
              const dimmed = hoveredAnnotation !== null && hoveredAnnotation !== i;

              const slotIdx = dateSlotIndex.get(ann.date) ?? 0;
              dateSlotIndex.set(ann.date, slotIdx + 1);
              const totalSlots = dateSlotCount.get(ann.date) ?? 1;

              return (
                <ReferenceLine
                  key={`${ann.date}-${ann.title}`}
                  yAxisId="left"
                  x={ann.date}
                  stroke={color}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  strokeOpacity={dimmed ? 0.1 : 0.4}
                >
                  <Label
                    content={({ viewBox }) => {
                      const vb = viewBox as { x: number; y: number; height: number };
                      const offset = totalSlots > 1 ? slotIdx * 24 : 0;
                      const cx = vb.x;
                      const cy = vb.y + vb.height + 36 + offset;
                      return (
                        <g
                          style={{ cursor: "pointer" }}
                          opacity={dimmed ? 0.3 : 1}
                          onMouseEnter={() => onHoverAnnotation(i)}
                          onMouseLeave={() => onHoverAnnotation(null)}
                        >
                          <circle cx={cx} cy={cy} r={10} fill={color} />
                          <text
                            x={cx}
                            y={cy}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#1a1a2e"
                            fontSize={11}
                            fontWeight={600}
                          >
                            {i + 1}
                          </text>
                        </g>
                      );
                    }}
                  />
                </ReferenceLine>
              );
            });
          })()}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
