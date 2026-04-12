import { useState, useMemo } from "react";
import { calculateWeeklyGrowth } from "../utils/metrics";
import { formatCompact, formatGrowth, formatDelta } from "../utils/format";
import type { ArtistConfig, ArtistData } from "../types";

interface GrowthRankingProps {
  artists: ArtistConfig[];
  dataById: Record<string, ArtistData>;
  onSelect: (artistId: string) => void;
}

export function GrowthRanking({ artists, dataById, onSelect }: GrowthRankingProps) {
  const [metric, setMetric] = useState<"spotify" | "youtube">("spotify");
  const [sortBy, setSortBy] = useState<"1d" | "7d">("1d");

  const ranked = useMemo(() => {
    return artists
      .map((artist) => {
        const data = dataById[artist.id];
        if (!data?.records.length) return { artist, daily: null, weekly: null, current: 0 };

        const records = data.records;
        const current = records[records.length - 1];
        const previous = records.length >= 2 ? records[records.length - 2] : null;

        let daily: number | null = null;
        let dailyAbs: number | null = null;
        let weekly: number | null = null;

        if (metric === "spotify") {
          if (previous) {
            const diff = current.monthly_listeners - previous.monthly_listeners;
            dailyAbs = diff;
            daily = previous.monthly_listeners > 0
              ? (diff / previous.monthly_listeners) * 100
              : null;
          }
          weekly = calculateWeeklyGrowth(records);
        } else {
          if (previous && current.youtube_subscribers != null && previous.youtube_subscribers != null) {
            const diff = current.youtube_subscribers - previous.youtube_subscribers;
            dailyAbs = diff;
            daily = previous.youtube_subscribers > 0
              ? (diff / previous.youtube_subscribers) * 100
              : null;
          }
          if (records.length >= 8) {
            const cur = current.youtube_subscribers;
            const prev = records[records.length - 8].youtube_subscribers;
            if (cur != null && prev != null && prev > 0) {
              weekly = ((cur - prev) / prev) * 100;
            }
          }
        }

        return {
          artist,
          daily,
          dailyAbs,
          weekly,
          current: metric === "spotify"
            ? current.monthly_listeners
            : (current.youtube_subscribers ?? 0),
        };
      })
      .sort((a, b) => {
        const av = sortBy === "1d" ? a.dailyAbs : a.weekly;
        const bv = sortBy === "1d" ? b.dailyAbs : b.weekly;
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return bv - av;
      });
  }, [artists, dataById, metric, sortBy]);

  return (
    <div className="growth-ranking fade-in">
      <div className="growth-ranking-header">
        <h2 className="growth-ranking-title">Growth Ranking</h2>
        <div className="growth-metric-toggle">
          <button
            className={`growth-metric-btn ${metric === "spotify" ? "active" : ""}`}
            onClick={() => setMetric("spotify")}
          >
            Spotify
          </button>
          <button
            className={`growth-metric-btn ${metric === "youtube" ? "active" : ""}`}
            onClick={() => setMetric("youtube")}
          >
            YouTube
          </button>
        </div>
      </div>
      <div className="growth-ranking-table">
        <div className="growth-ranking-row growth-ranking-row--header">
          <span className="growth-rank-col">#</span>
          <span className="growth-name-col">Artist</span>
          <span className="growth-current-col">Current</span>
          <span
            className={`growth-rate-col ${sortBy === "1d" ? "growth-rate-col--active" : ""}`}
            onClick={() => setSortBy("1d")}
          >
            1D {sortBy === "1d" ? "↓" : ""}
          </span>
          <span
            className={`growth-rate-col ${sortBy === "7d" ? "growth-rate-col--active" : ""}`}
            onClick={() => setSortBy("7d")}
          >
            7D {sortBy === "7d" ? "↓" : ""}
          </span>
        </div>
        {ranked.map((item, i) => (
          <div
            key={item.artist.id}
            className="growth-ranking-row"
            onClick={() => onSelect(item.artist.id)}
          >
            <span className="growth-rank-col">{i + 1}</span>
            <span className="growth-name-col">
              {item.artist.name}
              {item.artist.region && (
                <span className="table-region-badge">
                  {item.artist.region === "jp" ? "JP" : "GL"}
                </span>
              )}
            </span>
            <span className="growth-current-col">{formatCompact(item.current)}</span>
            <span
              className={`growth-rate-col ${
                item.daily === null ? "" : item.daily >= 0 ? "positive" : "negative"
              }`}
            >
              {item.dailyAbs != null ? formatDelta(item.dailyAbs) : "—"}
            </span>
            <span
              className={`growth-rate-col ${
                item.weekly === null ? "" : item.weekly >= 0 ? "positive" : "negative"
              }`}
            >
              {formatGrowth(item.weekly)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
