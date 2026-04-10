import { useMemo } from "react";
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

interface ChartRow {
  date: string;
  monthly_listeners: number;
  listeners_ma7: number;
  youtube_subscribers?: number;
  delta: number | null;
}

interface ListenerChartProps {
  records: ListenerRecord[];
  visibleAnnotations: Annotation[];
  hoveredAnnotation: number | null;
  onHoverAnnotation: (index: number | null) => void;
}

export function ListenerChart({ records, visibleAnnotations, hoveredAnnotation, onHoverAnnotation }: ListenerChartProps) {
  const chartData = useMemo<ChartRow[]>(() => {
    return records.map((r, i) => {
      const start = Math.max(0, i - 6);
      const slice = records.slice(start, i + 1);
      const ma = slice.reduce((s, x) => s + x.monthly_listeners, 0) / slice.length;
      const delta = i > 0 ? r.monthly_listeners - records[i - 1].monthly_listeners : null;
      return {
        date: r.date,
        monthly_listeners: r.monthly_listeners,
        listeners_ma7: Math.round(ma),
        youtube_subscribers: r.youtube_subscribers,
        delta,
      };
    });
  }, [records]);

  if (records.length === 0) {
    return <div className="chart-empty">データがありません</div>;
  }

  const hasYoutube = records.some((r) => r.youtube_subscribers != null);
  const hasDelta = records.length >= 2;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={420}>
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
              width={48}
            />
          )}
          <Tooltip
            contentStyle={{
              ...TOOLTIP_STYLE,
              fontSize: 13,
              padding: "10px 14px",
            }}
            formatter={(value, name) => {
              const v = Number(value);
              if (name === "delta") {
                return [`${v >= 0 ? "+" : ""}${v.toLocaleString("en-US")}`, "Daily Change"];
              }
              const formatted = v.toLocaleString("en-US");
              if (name === "monthly_listeners") return [formatted, "Spotify"];
              if (name === "listeners_ma7") return [formatted, "7d MA"];
              if (name === "youtube_subscribers") return [formatted, "YouTube"];
              return [formatted, String(name)];
            }}
            labelStyle={LABEL_STYLE}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              if (value === "monthly_listeners") return "Spotify Listeners";
              if (value === "listeners_ma7") return "7d MA";
              if (value === "youtube_subscribers") return "YouTube Subscribers";
              if (value === "delta") return "Daily Change";
              return String(value);
            }}
            wrapperStyle={{ fontSize: 12, color: "#7a8599" }}
          />
          {hasDelta && (
            <Bar yAxisId="right" dataKey="delta" name="delta" maxBarSize={20} fillOpacity={0.6} fill="#a0aec0">
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={(entry.delta ?? 0) >= 0 ? COLORS.deltaUp : COLORS.deltaDown}
                />
              ))}
            </Bar>
          )}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="monthly_listeners"
            name="monthly_listeners"
            stroke={COLORS.spotify}
            strokeWidth={2}
            dot={false}
            activeDot={{ fill: COLORS.spotify, r: 4, stroke: ACTIVE_DOT_STROKE, strokeWidth: 2 }}
          />
          {records.length >= 2 && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="listeners_ma7"
              name="listeners_ma7"
              stroke={COLORS.ma7}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ fill: COLORS.ma7, r: 3, stroke: ACTIVE_DOT_STROKE, strokeWidth: 2 }}
            />
          )}
          {hasYoutube && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="youtube_subscribers"
              name="youtube_subscribers"
              stroke={COLORS.youtube}
              strokeWidth={2}
              dot={false}
              activeDot={{ fill: COLORS.youtube, r: 4, stroke: ACTIVE_DOT_STROKE, strokeWidth: 2 }}
              connectNulls
            />
          )}
          {visibleAnnotations.map((ann, i) => {
            const color = CATEGORY_COLORS[ann.category] ?? CATEGORY_COLORS.other;
            const dimmed = hoveredAnnotation !== null && hoveredAnnotation !== i;
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
                    const cx = vb.x;
                    const cy = vb.y + vb.height + 36;
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
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
