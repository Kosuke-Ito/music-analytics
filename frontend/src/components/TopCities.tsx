import { useMemo } from "react";
import type { CityListeners } from "../types";
import { formatNumber } from "../utils/format";

interface TopCitiesProps {
  cities?: CityListeners[];
  prevCities?: CityListeners[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  JP: "🇯🇵", US: "🇺🇸", GB: "🇬🇧", KR: "🇰🇷", MX: "🇲🇽", BR: "🇧🇷",
  TW: "🇹🇼", ID: "🇮🇩", IN: "🇮🇳", DE: "🇩🇪", FR: "🇫🇷", AU: "🇦🇺",
  CA: "🇨🇦", TH: "🇹🇭", PH: "🇵🇭", ES: "🇪🇸", IT: "🇮🇹", CL: "🇨🇱",
  AR: "🇦🇷", CO: "🇨🇴", PE: "🇵🇪", SG: "🇸🇬", MY: "🇲🇾", TR: "🇹🇷",
  SE: "🇸🇪", NL: "🇳🇱", PL: "🇵🇱", NG: "🇳🇬", ZA: "🇿🇦", EG: "🇪🇬",
};

function cityKey(c: CityListeners) {
  return `${c.city}-${c.country}`;
}

export function TopCities({ cities, prevCities }: TopCitiesProps) {
  if (!cities?.length) return null;

  const prevMap = useMemo(() => {
    if (!prevCities) return null;
    const map = new Map<string, { listeners: number; rank: number }>();
    prevCities.forEach((c, i) => map.set(cityKey(c), { listeners: c.listeners, rank: i }));
    return map;
  }, [prevCities]);

  const maxListeners = cities[0].listeners;

  return (
    <div className="top-cities-section">
      <span className="chart-section-title">
        Spotify Top Cities
        <span className="section-help" title="Spotify公式APIから取得した上位5都市のリスナー数。ページネーション不可のため、全都市データではなく上位5都市に限定されます。海外インパクト分析もこのデータベースの推定値です。"> ⓘ</span>
      </span>
      <div className="top-cities">
        {cities.map((city, index) => {
          const prev = prevMap?.get(cityKey(city));
          const delta = prev ? city.listeners - prev.listeners : null;
          const rankChange = prev ? prev.rank - index : null;

          return (
            <div key={cityKey(city)} className="city-row">
              <div className="city-info">
                <span className="city-flag">{COUNTRY_FLAGS[city.country] ?? "🌐"}</span>
                <span className="city-name">{city.city}</span>
                <span className="city-country">{city.country}</span>
                {rankChange !== null && rankChange !== 0 && (
                  <span className={`city-rank-change ${rankChange > 0 ? "positive" : "negative"}`}>
                    {rankChange > 0 ? "↑" : "↓"}{Math.abs(rankChange)}
                  </span>
                )}
              </div>
              <div className="city-bar-wrapper">
                <div
                  className="city-bar"
                  style={{ width: `${(city.listeners / maxListeners) * 100}%` }}
                />
              </div>
              <div className="city-listeners-col">
                <span className="city-listeners">
                  {formatNumber(city.listeners)}
                </span>
                {delta !== null && delta !== 0 && (
                  <span className={`city-delta ${delta > 0 ? "positive" : "negative"}`}>
                    {delta > 0 ? "+" : ""}{formatNumber(delta)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
