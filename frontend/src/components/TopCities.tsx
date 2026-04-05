import type { CityListeners } from "../types";

interface TopCitiesProps {
  cities?: CityListeners[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  JP: "🇯🇵", US: "🇺🇸", GB: "🇬🇧", KR: "🇰🇷", MX: "🇲🇽", BR: "🇧🇷",
  TW: "🇹🇼", ID: "🇮🇩", IN: "🇮🇳", DE: "🇩🇪", FR: "🇫🇷", AU: "🇦🇺",
  CA: "🇨🇦", TH: "🇹🇭", PH: "🇵🇭", ES: "🇪🇸", IT: "🇮🇹", CL: "🇨🇱",
  AR: "🇦🇷", CO: "🇨🇴", PE: "🇵🇪", SG: "🇸🇬", MY: "🇲🇾", TR: "🇹🇷",
  SE: "🇸🇪", NL: "🇳🇱", PL: "🇵🇱", NG: "🇳🇬", ZA: "🇿🇦", EG: "🇪🇬",
};

export function TopCities({ cities }: TopCitiesProps) {
  if (!cities?.length) return null;

  const maxListeners = cities[0].listeners;

  return (
    <div className="top-cities-section">
      <span className="chart-section-title">Spotify Top Cities</span>
      <div className="top-cities">
        {cities.map((city) => (
          <div key={`${city.city}-${city.country}`} className="city-row">
            <div className="city-info">
              <span className="city-flag">{COUNTRY_FLAGS[city.country] ?? "🌐"}</span>
              <span className="city-name">{city.city}</span>
              <span className="city-country">{city.country}</span>
            </div>
            <div className="city-bar-wrapper">
              <div
                className="city-bar"
                style={{ width: `${(city.listeners / maxListeners) * 100}%` }}
              />
            </div>
            <span className="city-listeners">
              {city.listeners.toLocaleString("en-US")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
