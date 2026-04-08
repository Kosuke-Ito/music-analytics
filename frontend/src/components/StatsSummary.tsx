import type { ListenerRecord } from "../types";
import { calculateRetentionScore, calculateYouTubeEfficiency } from "../utils/metrics";

interface StatsSummaryProps {
  records: ListenerRecord[];
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatPct(p: number): string {
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(1)}%`;
}

export function StatsSummary({ records }: StatsSummaryProps) {
  if (records.length === 0) {
    return (
      <div className="stats-groups">
        <div className="stats-group">
          <div className="stats-group-title">Spotify</div>
          <div className="stats-summary">
            <div className="stat-card">
              <span className="stat-label">Monthly Listeners</span>
              <span className="stat-value">-</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = records[records.length - 1];
  const previous = records.length >= 2 ? records[records.length - 2] : null;
  const weekAgo = records.length > 7 ? records[records.length - 8] : null;

  const listenerChange = previous
    ? current.monthly_listeners - previous.monthly_listeners
    : null;
  const listenerWeekChange = weekAgo
    ? current.monthly_listeners - weekAgo.monthly_listeners
    : null;
  const listenerWeekPct =
    weekAgo && weekAgo.monthly_listeners > 0
      ? ((current.monthly_listeners - weekAgo.monthly_listeners) / weekAgo.monthly_listeners) * 100
      : null;

  const subscriberChange =
    previous?.youtube_subscribers != null && current.youtube_subscribers != null
      ? current.youtube_subscribers - previous.youtube_subscribers
      : null;
  const subscriberWeekChange =
    weekAgo?.youtube_subscribers != null && current.youtube_subscribers != null
      ? current.youtube_subscribers - weekAgo.youtube_subscribers
      : null;
  const subscriberWeekPct =
    weekAgo &&
    weekAgo.youtube_subscribers != null &&
    weekAgo.youtube_subscribers > 0 &&
    current.youtube_subscribers != null
      ? ((current.youtube_subscribers - weekAgo.youtube_subscribers) / weekAgo.youtube_subscribers) * 100
      : null;

  const dataWarning = current.validation_flags?.includes("large_monthly_listener_delta");
  const hasYoutube = current.youtube_subscribers != null;

  const retention = calculateRetentionScore(current.spotify_followers, current.monthly_listeners);
  const ytEfficiency = calculateYouTubeEfficiency(current.youtube_total_views, current.youtube_subscribers);

  return (
    <div className="stats-groups">
      {dataWarning && (
        <div className="stat-card stat-warning" style={{ marginBottom: 16 }}>
          <span className="stat-label">Data quality</span>
          <span className="stat-value">
            前回比でリスナー変動が大きいです（記録は保存済み・要確認）
          </span>
        </div>
      )}

      <div className="stats-group">
        <div className="stats-group-title">Spotify</div>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-label">Monthly Listeners</span>
            <span className="stat-value">{formatNumber(current.monthly_listeners)}</span>
          </div>
          {current.spotify_followers != null && (
            <div className="stat-card">
              <span className="stat-label">Followers</span>
              <span className="stat-value">{formatNumber(current.spotify_followers)}</span>
            </div>
          )}
          {listenerChange !== null && (
            <div className="stat-card">
              <span className="stat-label">前日比</span>
              <span className={`stat-value ${listenerChange >= 0 ? "positive" : "negative"}`}>
                {listenerChange >= 0 ? "+" : ""}
                {formatNumber(listenerChange)}
              </span>
            </div>
          )}
          {listenerWeekChange !== null && (
            <div className="stat-card">
              <span className="stat-label">7日比</span>
              <span className={`stat-value ${listenerWeekChange >= 0 ? "positive" : "negative"}`}>
                {listenerWeekChange >= 0 ? "+" : ""}
                {formatNumber(listenerWeekChange)}
                {listenerWeekPct !== null && (
                  <span className="stat-sub"> ({formatPct(listenerWeekPct)})</span>
                )}
              </span>
            </div>
          )}
          {retention !== null && (
            <div className="stat-card">
              <span className="stat-label">Fan Retention</span>
              <span className="stat-value">{retention.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {hasYoutube && (
        <div className="stats-group">
          <div className="stats-group-title">YouTube</div>
          <div className="stats-summary">
            <div className="stat-card">
              <span className="stat-label">Subscribers</span>
              <span className="stat-value">{formatNumber(current.youtube_subscribers!)}</span>
            </div>
            {current.youtube_total_views != null && (
              <div className="stat-card">
                <span className="stat-label">Total Views</span>
                <span className="stat-value">{formatCompact(current.youtube_total_views)}</span>
              </div>
            )}
            {subscriberChange !== null && (
              <div className="stat-card">
                <span className="stat-label">前日比</span>
                <span className={`stat-value ${subscriberChange >= 0 ? "positive" : "negative"}`}>
                  {subscriberChange >= 0 ? "+" : ""}
                  {formatNumber(subscriberChange)}
                </span>
              </div>
            )}
            {subscriberWeekChange !== null && (
              <div className="stat-card">
                <span className="stat-label">7日比</span>
                <span className={`stat-value ${subscriberWeekChange >= 0 ? "positive" : "negative"}`}>
                  {subscriberWeekChange >= 0 ? "+" : ""}
                  {formatNumber(subscriberWeekChange)}
                  {subscriberWeekPct !== null && (
                    <span className="stat-sub"> ({formatPct(subscriberWeekPct)})</span>
                  )}
                </span>
              </div>
            )}
            {ytEfficiency !== null && (
              <div className="stat-card">
                <span className="stat-label">Efficiency</span>
                <span className="stat-value">{ytEfficiency.toFixed(1)} <span className="stat-sub">views/sub</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="stats-group">
        <div className="stats-group-title">Info</div>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-label">最新取得日</span>
            <span className="stat-value stat-date">{current.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
