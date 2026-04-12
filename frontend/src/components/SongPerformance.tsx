import { useMemo } from "react";
import type { SongPerformanceData } from "../types";
import { formatCompact, formatDelta } from "../utils/format";

interface SongPerformanceProps {
  songPerformance?: SongPerformanceData;
}

interface SongRow {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  delta: number | null;
}

export function SongPerformance({ songPerformance }: SongPerformanceProps) {
  const songs = useMemo<SongRow[]>(() => {
    if (!songPerformance) return [];

    return Object.entries(songPerformance)
      .map(([videoId, data]) => {
        const history = data.history;
        if (!history.length) return null;

        const latest = history[history.length - 1];
        const prev = history.length >= 2 ? history[history.length - 2] : null;
        const delta = prev ? latest.views - prev.views : null;

        return {
          videoId,
          title: data.title,
          views: latest.views,
          likes: latest.likes,
          delta,
        };
      })
      .filter((s): s is SongRow => s !== null)
      .sort((a, b) => b.views - a.views);
  }, [songPerformance]);

  if (songs.length === 0) return null;

  return (
    <div className="song-perf-section">
      <span className="chart-section-title">楽曲パフォーマンス</span>
      <div className="song-perf-list">
        {songs.map((song, i) => (
          <div key={song.videoId} className="song-perf-item">
            <span className="song-perf-rank">{i + 1}</span>
            <div className="song-perf-info">
              <span className="song-perf-title">{song.title}</span>
              <span className="song-perf-likes">{formatCompact(song.likes)} likes</span>
            </div>
            <div className="song-perf-stats">
              <span className="song-perf-views">{formatCompact(song.views)} views</span>
              {song.delta !== null && (
                <span className={`song-perf-delta ${song.delta >= 0 ? "positive" : "negative"}`}>
                  {formatDelta(song.delta)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
