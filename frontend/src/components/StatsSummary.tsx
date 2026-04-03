import type { ListenerRecord } from "../types";

interface StatsSummaryProps {
  records: ListenerRecord[];
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function StatsSummary({ records }: StatsSummaryProps) {
  if (records.length === 0) {
    return (
      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-label">Monthly Listeners</span>
          <span className="stat-value">-</span>
        </div>
      </div>
    );
  }

  const current = records[records.length - 1];
  const previous = records.length >= 2 ? records[records.length - 2] : null;
  const listenerChange = previous
    ? current.monthly_listeners - previous.monthly_listeners
    : null;
  const subscriberChange =
    previous?.youtube_subscribers != null && current.youtube_subscribers != null
      ? current.youtube_subscribers - previous.youtube_subscribers
      : null;

  return (
    <div className="stats-summary">
      <div className="stat-card">
        <span className="stat-label">Monthly Listeners</span>
        <span className="stat-value">{formatNumber(current.monthly_listeners)}</span>
      </div>
      {listenerChange !== null && (
        <div className="stat-card">
          <span className="stat-label">Listeners 前日比</span>
          <span className={`stat-value ${listenerChange >= 0 ? "positive" : "negative"}`}>
            {listenerChange >= 0 ? "+" : ""}
            {formatNumber(listenerChange)}
          </span>
        </div>
      )}
      {current.youtube_subscribers != null && (
        <div className="stat-card">
          <span className="stat-label">YouTube Subscribers</span>
          <span className="stat-value">{formatNumber(current.youtube_subscribers)}</span>
        </div>
      )}
      {subscriberChange !== null && (
        <div className="stat-card">
          <span className="stat-label">Subscribers 前日比</span>
          <span className={`stat-value ${subscriberChange >= 0 ? "positive" : "negative"}`}>
            {subscriberChange >= 0 ? "+" : ""}
            {formatNumber(subscriberChange)}
          </span>
        </div>
      )}
      <div className="stat-card">
        <span className="stat-label">最新取得日</span>
        <span className="stat-value stat-date">{current.date}</span>
      </div>
    </div>
  );
}
