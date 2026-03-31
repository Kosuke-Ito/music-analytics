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
  const change = previous
    ? current.monthly_listeners - previous.monthly_listeners
    : null;

  return (
    <div className="stats-summary">
      <div className="stat-card">
        <span className="stat-label">Monthly Listeners</span>
        <span className="stat-value">{formatNumber(current.monthly_listeners)}</span>
      </div>
      {change !== null && (
        <div className="stat-card">
          <span className="stat-label">前日比</span>
          <span className={`stat-value ${change >= 0 ? "positive" : "negative"}`}>
            {change >= 0 ? "+" : ""}
            {formatNumber(change)}
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
