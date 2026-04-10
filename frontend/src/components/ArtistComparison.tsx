import { useState } from "react";
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
import type { ArtistData } from "../types";
import { formatCompact } from "../utils/format";
import { TOOLTIP_STYLE, ARTIST_COLORS, GRID_STROKE, TICK_STYLE, LABEL_STYLE, ACTIVE_DOT_STROKE } from "../constants/chart";

interface ArtistComparisonProps {
  artistIds: string[];
  dataById: Record<string, ArtistData>;
}

export function ArtistComparison({ artistIds, dataById }: ArtistComparisonProps) {
  const [metric, setMetric] = useState<"spotify" | "youtube">("spotify");

  // 全アーティストの日付を集めてユニークにソート
  const allDates = new Set<string>();
  for (const id of artistIds) {
    const data = dataById[id];
    if (data) {
      for (const r of data.records) {
        allDates.add(r.date);
      }
    }
  }
  const sortedDates = [...allDates].sort();

  // 日付ベースのマージデータを作成
  const chartData = sortedDates.map((date) => {
    const point: Record<string, string | number | null> = { date };
    for (const id of artistIds) {
      const record = dataById[id]?.records.find((r) => r.date === date);
      if (metric === "spotify") {
        point[id] = record?.monthly_listeners ?? null;
      } else {
        point[id] = record?.youtube_subscribers ?? null;
      }
    }
    return point;
  });

  if (artistIds.length === 0) {
    return (
      <div className="comparison-empty">
        サイドバーからアーティストを選択してください（チェックボックスで複数選択）
      </div>
    );
  }

  return (
    <div className="comparison fade-in">
      <div className="comparison-header">
        <h2 className="comparison-title">Compare Artists</h2>
        <div className="growth-metric-toggle">
          <button
            className={`growth-metric-btn ${metric === "spotify" ? "active" : ""}`}
            onClick={() => setMetric("spotify")}
          >
            Spotify Listeners
          </button>
          <button
            className={`growth-metric-btn ${metric === "youtube" ? "active" : ""}`}
            onClick={() => setMetric("youtube")}
          >
            YouTube Subscribers
          </button>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
              tickFormatter={formatCompact}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              contentStyle={{
                ...TOOLTIP_STYLE,
                fontSize: 12,
                padding: "10px 14px",
              }}
              formatter={(value, name) => {
                const artistName = dataById[name as string]?.artist_name ?? name;
                return [Number(value).toLocaleString("en-US"), artistName];
              }}
              labelStyle={LABEL_STYLE}
            />
            <Legend
              formatter={(value) => dataById[value]?.artist_name ?? value}
              wrapperStyle={{ fontSize: 12, color: "#7a8599" }}
            />
            {artistIds.map((id, i) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                stroke={ARTIST_COLORS[i % ARTIST_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{
                  fill: ARTIST_COLORS[i % ARTIST_COLORS.length],
                  r: 4,
                  stroke: ACTIVE_DOT_STROKE,
                  strokeWidth: 2,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
