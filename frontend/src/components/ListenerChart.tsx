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

type Platform = "spotify" | "youtube" | "ytm" | "lastfm";

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "spotify", label: "Spotify" },
  { value: "youtube", label: "YouTube" },
  { value: "ytm", label: "YT Music" },
  { value: "lastfm", label: "Last.fm" },
];

interface ListenerChartProps {
  records: ListenerRecord[];
  visibleAnnotations: Annotation[];
  hoveredAnnotation: number | null;
  onHoverAnnotation: (index: number | null) => void;
}

function calcDelta(values: (number | undefined)[], i: number): number | null {
  if (i === 0) return null;
  const cur = values[i];
  const prev = values[i - 1];
  if (cur == null || prev == null) return null;
  return cur - prev;
}

function calcMA7(values: (number | undefined)[], i: number): number | null {
  const start = Math.max(0, i - 6);
  const slice = values.slice(start, i + 1).filter((v): v is number => v != null);
  if (slice.length === 0) return null;
  return Math.round(slice.reduce((s, v) => s + v, 0) / slice.length);
}

export function ListenerChart({ records, visibleAnnotations, hoveredAnnotation, onHoverAnnotation }: ListenerChartProps) {
  const hasYoutube = records.some((r) => r.youtube_subscribers != null);
  const hasYTM = records.some((r) => r.ytm_monthly_listeners != null);
  // Last.fm は収集継続するが表示対象外

  const availablePlatforms = useMemo(() => {
    const platforms: Platform[] = ["spotify"];
    if (hasYoutube) platforms.push("youtube");
    if (hasYTM) platforms.push("ytm");
    return platforms;
  }, [hasYoutube, hasYTM]);

  const [platform, setPlatform] = useState<Platform>("spotify");

  const chartData = useMemo(() => {
    return records.map((r, i) => {
      const row: Record<string, string | number | null> = { date: r.date };

      if (platform === "spotify") {
        row.primary = r.monthly_listeners;
        row.secondary = r.spotify_followers ?? null;
        row.ma7 = calcMA7(records.map((x) => x.monthly_listeners), i);
        row.delta = calcDelta(records.map((x) => x.monthly_listeners), i);
      } else if (platform === "youtube") {
        row.primary = r.youtube_subscribers ?? null;
        row.secondary = r.youtube_total_views ?? null;
        row.delta = calcDelta(records.map((x) => x.youtube_subscribers), i);
      } else if (platform === "ytm") {
        row.primary = r.ytm_monthly_listeners ?? null;
        row.secondary = r.ytm_subscribers ?? null;
        row.delta = calcDelta(records.map((x) => x.ytm_monthly_listeners), i);
      } else if (platform === "lastfm") {
        row.primary = r.lastfm_listeners ?? null;
        row.secondary = r.lastfm_playcount ?? null;
        row.delta = calcDelta(records.map((x) => x.lastfm_listeners), i);
      }

      return row;
    });
  }, [records, platform]);

  const platformLabels: Record<Platform, { primary: string; secondary: string; delta: string }> = {
    spotify: { primary: "Monthly Listeners", secondary: "Followers", delta: "Daily Change" },
    youtube: { primary: "Subscribers", secondary: "Total Views", delta: "Daily Change" },
    ytm: { primary: "Monthly Listeners", secondary: "Subscribers", delta: "Daily Change" },
    lastfm: { primary: "Listeners", secondary: "Scrobbles", delta: "Daily Change" },
  };

  const platformColors: Record<Platform, { primary: string; secondary: string }> = {
    spotify: { primary: COLORS.spotify, secondary: COLORS.ma7 },
    youtube: { primary: COLORS.youtube, secondary: "var(--text-muted)" },
    ytm: { primary: COLORS.youtube, secondary: COLORS.ma7 },
    lastfm: { primary: "#d51007", secondary: "var(--text-muted)" },
  };

  const labels = platformLabels[platform];
  const colors = platformColors[platform];
  const hasDelta = records.length >= 2;
  const hasSecondary = chartData.some((d) => d.secondary != null);
  const showMA7 = platform === "spotify";

  if (records.length === 0) {
    return <div className="chart-empty">データがありません</div>;
  }

  return (
    <div className="chart-container chart-container--main">
      {availablePlatforms.length > 1 && (
        <div className="range-filter" style={{ marginBottom: 12 }}>
          {availablePlatforms.map((p) => (
            <button
              key={p}
              className={`range-btn ${platform === p ? "range-btn--active" : ""}`}
              onClick={() => setPlatform(p)}
            >
              {PLATFORM_OPTIONS.find((o) => o.value === p)?.label}
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
              if (name === "primary") return [formatted, labels.primary];
              if (name === "secondary") return [formatted, labels.secondary];
              if (name === "ma7") return [formatted, "7d MA"];
              if (name === "delta") return [formatted, labels.delta];
              return [formatted, String(name)];
            }}
            labelStyle={LABEL_STYLE}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              if (value === "primary") return labels.primary;
              if (value === "secondary") return labels.secondary;
              if (value === "ma7") return "7d MA";
              if (value === "delta") return labels.delta;
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
            dataKey="primary"
            stroke={colors.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ fill: colors.primary, r: 4, stroke: ACTIVE_DOT_STROKE, strokeWidth: 2 }}
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
          {hasSecondary && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="secondary"
              stroke={colors.secondary}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ fill: colors.secondary, r: 4, stroke: ACTIVE_DOT_STROKE, strokeWidth: 2 }}
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
