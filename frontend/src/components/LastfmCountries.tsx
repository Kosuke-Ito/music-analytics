import type { ListenerRecord } from "../types";
import { formatNumber } from "../utils/format";

interface LastfmStatsProps {
  record?: ListenerRecord;
}

export function LastfmCountries({ record }: LastfmStatsProps) {
  if (!record?.lastfm_listeners && !record?.lastfm_playcount) return null;

  return (
    <div className="stats-group">
      <div className="stats-group-title">Last.fm</div>
      <div className="stats-summary">
        {record.lastfm_listeners != null && (
          <div className="stat-card">
            <span className="stat-label">Listeners</span>
            <span className="stat-value">{formatNumber(record.lastfm_listeners)}</span>
          </div>
        )}
        {record.lastfm_playcount != null && (
          <div className="stat-card">
            <span className="stat-label">Total Scrobbles</span>
            <span className="stat-value">{formatNumber(record.lastfm_playcount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
