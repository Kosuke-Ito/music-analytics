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
import { formatDeltaCompact } from "../utils/format";
import { TOOLTIP_STYLE, GRID_STROKE, TICK_STYLE, LABEL_STYLE } from "../constants/chart";

interface DeltaChartProps {
  records: ListenerRecord[];
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
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ ...TICK_STYLE, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ ...TICK_STYLE, fontSize: 11 }}
              tickFormatter={formatDeltaCompact}
              tickLine={false}
              axisLine={false}
              width={52}
              domain={["auto", "auto"]}
            />
            <ReferenceLine y={0} stroke="var(--chart-tick)" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                ...TOOLTIP_STYLE,
                fontSize: 13,
                padding: "10px 14px",
              }}
              formatter={(value) => [
                `${Number(value) >= 0 ? "+" : ""}${Number(value).toLocaleString("en-US")}`,
                "Change",
              ]}
              labelStyle={LABEL_STYLE}
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
