import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { ListenerRecord } from "../types";
import {
  aggregateByCountry,
  calcOverseasRatio,
  buildCityTimeSeries,
  isJapan,
} from "../utils/geography";
import { formatCompact, formatDeltaCompact } from "../utils/format";
import { TOOLTIP_STYLE, GRID_STROKE, TICK_STYLE } from "../constants/chart";

const COUNTRY_FLAGS: Record<string, string> = {
  JP: "🇯🇵", US: "🇺🇸", GB: "🇬🇧", KR: "🇰🇷", MX: "🇲🇽", BR: "🇧🇷",
  TW: "🇹🇼", ID: "🇮🇩", IN: "🇮🇳", DE: "🇩🇪", FR: "🇫🇷", AU: "🇦🇺",
  CA: "🇨🇦", TH: "🇹🇭", PH: "🇵🇭", ES: "🇪🇸", IT: "🇮🇹", CL: "🇨🇱",
  AR: "🇦🇷", CO: "🇨🇴", PE: "🇵🇪", SG: "🇸🇬", MY: "🇲🇾", TR: "🇹🇷",
  SE: "🇸🇪", NL: "🇳🇱", PL: "🇵🇱", NG: "🇳🇬", ZA: "🇿🇦", EG: "🇪🇬",
};

const CITY_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7",
];

interface OverseasImpactProps {
  records: ListenerRecord[];
}

export function OverseasImpact({ records }: OverseasImpactProps) {
  const latestCities = records[records.length - 1]?.top_cities;
  if (!latestCities?.length) return null;

  const countryBreakdown = useMemo(() => aggregateByCountry(latestCities), [latestCities]);
  const overseasPct = useMemo(() => calcOverseasRatio(latestCities), [latestCities]);
  const jpPct = 100 - overseasPct;

  const ratioTimeSeries = useMemo(() => {
    return records
      .filter((r) => r.top_cities?.length)
      .map((r) => ({
        date: r.date,
        overseas: Math.round(calcOverseasRatio(r.top_cities!) * 10) / 10,
      }));
  }, [records]);

  const cityTs = useMemo(() => buildCityTimeSeries(records), [records]);

  const cityChartData = useMemo(() => {
    if (cityTs.dates.length === 0) return [];
    return cityTs.dates.map((date, i) => {
      const row: Record<string, string | number | null> = { date };
      for (const c of cityTs.cities) {
        row[`${c.city} (${c.country})`] = c.deltas[i];
      }
      return row;
    });
  }, [cityTs]);

  const totalListeners = countryBreakdown.reduce((s, c) => s + c.listeners, 0);

  return (
    <div className="overseas-section">
      <span className="chart-section-title">海外インパクト分析</span>
      <p className="overseas-hint">
        ℹ️ Top Cities（上位5都市）のデータに基づく推定値です。全リスナーの国別比率とは異なる場合があります。
      </p>

      {/* Country breakdown bar */}
      <div className="overseas-card">
        <div className="overseas-ratio-header">
          <span className="overseas-ratio-label">
            🇯🇵 国内 <strong>{jpPct.toFixed(1)}%</strong>
          </span>
          <span className="overseas-ratio-label">
            🌏 海外 <strong>{overseasPct.toFixed(1)}%</strong>
          </span>
        </div>
        <div className="overseas-ratio-bar">
          <div className="overseas-ratio-jp" style={{ width: `${jpPct}%` }} />
          <div className="overseas-ratio-intl" style={{ width: `${overseasPct}%` }} />
        </div>
        <div className="overseas-country-list">
          {countryBreakdown.map((c) => (
            <div key={c.country} className="overseas-country-item">
              <span className="overseas-country-flag">
                {COUNTRY_FLAGS[c.country] ?? "🌐"} {c.country}
              </span>
              <div className="overseas-country-bar-wrapper">
                <div
                  className={`overseas-country-bar ${isJapan(c.country) ? "overseas-country-bar--jp" : ""}`}
                  style={{ width: `${(c.listeners / totalListeners) * 100}%` }}
                />
              </div>
              <span className="overseas-country-value">
                {formatCompact(c.listeners)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Overseas ratio time series */}
      {ratioTimeSeries.length > 1 && (
        <div className="overseas-card">
          <span className="overseas-card-title">海外リスナー比率の推移</span>
          <div className="chart-container chart-container--small">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratioTimeSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="transparent"
                  tick={{ ...TICK_STYLE, fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ ...TICK_STYLE, fontSize: 11 }}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{ ...TOOLTIP_STYLE, fontSize: 12, padding: "8px 12px" }}
                  formatter={(value) => [`${value}%`, "海外比率"]}
                />
                <Line
                  type="monotone"
                  dataKey="overseas"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* City time series */}
      {cityChartData.length > 1 && (
        <div className="overseas-card">
          <span className="overseas-card-title">都市別リスナー日次変動</span>
          <div className="chart-container chart-container--main">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cityChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="transparent"
                  tick={{ ...TICK_STYLE, fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={formatDeltaCompact}
                  tick={{ ...TICK_STYLE, fontSize: 11 }}
                />
                <ReferenceLine y={0} stroke="var(--chart-tick)" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ ...TOOLTIP_STYLE, fontSize: 12, padding: "8px 12px" }}
                  formatter={(value) => {
                    if (value == null) return "—";
                    const n = Number(value);
                    return n >= 0 ? `+${n.toLocaleString("en-US")}` : n.toLocaleString("en-US");
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value: string) => value}
                  wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }}
                />
                {cityTs.cities.slice(0, 10).map((c, i) => (
                  <Line
                    key={`${c.city}-${c.country}`}
                    type="monotone"
                    dataKey={`${c.city} (${c.country})`}
                    stroke={CITY_COLORS[i % CITY_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
