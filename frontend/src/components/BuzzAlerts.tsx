import { useMemo, useState } from "react";
import type { ArtistConfig, ArtistData, BuzzEvent } from "../types";
import { formatNumber, formatCompact } from "../utils/format";

interface BuzzAlertItem {
  artistId: string;
  artistName: string;
  event: BuzzEvent;
}

const METRIC_LABELS: Record<string, string> = {
  monthly_listeners: "Spotify",
  ytm_monthly_listeners: "YouTube Music",
  youtube_total_views: "YouTube Views",
};

const TYPE_ICONS: Record<string, string> = {
  annotated: "🔥",
  organic: "⚡",
  seasonal: "🔄",
};

const TYPE_LABELS: Record<string, string> = {
  annotated: "施策連動",
  organic: "自然発生",
  seasonal: "季節パターン",
};

interface BuzzAlertsProps {
  artists: ArtistConfig[];
  dataById: Record<string, ArtistData>;
}

export function BuzzAlerts({ artists, dataById }: BuzzAlertsProps) {
  const alerts = useMemo(() => {
    const items: BuzzAlertItem[] = [];

    for (const artist of artists) {
      const data = dataById[artist.id];
      if (!data?.buzz_events?.length) continue;

      // 直近7日以内のバズのみ表示
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      for (const event of data.buzz_events) {
        if (event.date >= cutoffStr) {
          items.push({
            artistId: artist.id,
            artistName: data.artist_name,
            event,
          });
        }
      }
    }

    // score 降順でソート
    items.sort((a, b) => b.event.score - a.event.score);
    return items;
  }, [artists, dataById]);

  const [isOpen, setIsOpen] = useState(false);

  if (alerts.length === 0) return null;

  return (
    <div className="buzz-alerts section-collapsible">
      <button className="section-toggle" onClick={() => setIsOpen((v) => !v)}>
        <span className="chart-section-title">注目アーティスト ({alerts.length})</span>
        <span className="section-arrow">{isOpen ? "▼" : "▶"}</span>
      </button>
      {isOpen && <div className="buzz-list">
        {alerts.map((alert) => (
          <div
            key={`${alert.artistId}-${alert.event.date}-${alert.event.metric}`}
            className={`buzz-item buzz-item--${alert.event.type}`}
          >
            <span className="buzz-icon">{TYPE_ICONS[alert.event.type] ?? "📈"}</span>
            <div className="buzz-content">
              <div className="buzz-header">
                <span className="buzz-artist">{alert.artistName}</span>
                <span className="buzz-badge">{TYPE_LABELS[alert.event.type]}</span>
              </div>
              <div className="buzz-detail">
                <span className="buzz-metric">
                  {METRIC_LABELS[alert.event.metric] ?? alert.event.metric}
                </span>
                <span className="buzz-delta positive">
                  +{formatNumber(alert.event.delta)}
                </span>
                <span className="buzz-baseline">
                  (通常 ±{formatCompact(Math.round(alert.event.baseline_stddev))}/日)
                </span>
              </div>
              {alert.event.related_annotation && (
                <div className="buzz-annotation">
                  {alert.event.related_annotation}
                </div>
              )}
            </div>
            <span className="buzz-date">{alert.event.date}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}
