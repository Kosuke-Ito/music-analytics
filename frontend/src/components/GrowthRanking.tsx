import { useState, useMemo } from "react";
import { calculateWeeklyGrowth } from "../utils/metrics";
import type { ArtistConfig, ArtistData } from "../types";

interface GrowthRankingProps {
  artists: ArtistConfig[];
  dataById: Record<string, ArtistData>;
  onSelect: (artistId: string) => void;
}

function formatGrowth(v: number | null): string {
  if (v === null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("en-US");
}

export function GrowthRanking({ artists, dataById, onSelect }: GrowthRankingProps) {
  const [metric, setMetric] = useState<"spotify" | "youtube">("spotify");

  const ranked = useMemo(() => {
    return artists
      .map((artist) => {
        const data = dataById[artist.id];
        if (!data?.records.length) return { artist, growth: null, current: 0 };

        const records = data.records;
        const current = records[records.length - 1];

        let growth: number | null = null;
        if (metric === "spotify") {
          growth = calculateWeeklyGrowth(records);
        } else {
          // YouTube: 手動計算（subscribersの成長率）
          if (records.length >= 8) {
            const cur = current.youtube_subscribers;
            const prev = records[records.length - 8].youtube_subscribers;
            if (cur != null && prev != null && prev > 0) {
              growth = ((cur - prev) / prev) * 100;
            }
          }
        }

        return {
          artist,
          growth,
          current: metric === "spotify"
            ? current.monthly_listeners
            : (current.youtube_subscribers ?? 0),
        };
      })
      .sort((a, b) => {
        if (a.growth === null && b.growth === null) return 0;
        if (a.growth === null) return 1;
        if (b.growth === null) return -1;
        return b.growth - a.growth;
      });
  }, [artists, dataById, metric]);

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
          <span className="growth-rate-col">7d Growth</span>
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
            <span className="growth-current-col">{formatNumber(item.current)}</span>
            <span
              className={`growth-rate-col ${
                item.growth === null ? "" : item.growth >= 0 ? "positive" : "negative"
              }`}
            >
              {formatGrowth(item.growth)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
