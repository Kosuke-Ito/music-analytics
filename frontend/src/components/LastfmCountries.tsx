import type { LastfmCountry } from "../types";

interface LastfmCountriesProps {
  countries?: LastfmCountry[];
}

export function LastfmCountries({ countries }: LastfmCountriesProps) {
  if (!countries?.length) return null;

  const maxListeners = countries[0].listeners;

  return (
    <div className="top-cities-section">
      <span className="chart-section-title">Last.fm Top Countries</span>
      <div className="top-cities">
        {countries.map((c) => (
          <div key={c.country} className="city-row">
            <div className="city-info">
              <span className="city-name">{c.country}</span>
            </div>
            <div className="city-bar-wrapper">
              <div
                className="city-bar city-bar--lastfm"
                style={{ width: `${(c.listeners / maxListeners) * 100}%` }}
              />
            </div>
            <span className="city-listeners">
              {c.listeners.toLocaleString("en-US")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
