import { useMemo, useState } from "react";
import type { Annotation, ListenerRecord } from "../types";
import { formatDelta } from "../utils/format";

interface AnnotationImpactProps {
  records: ListenerRecord[];
  annotations?: Annotation[];
}

type WindowSize = "1d" | "3d" | "7d";
type Metric = "spotify" | "youtube";

const WINDOW_OPTIONS: { value: WindowSize; label: string }[] = [
  { value: "1d", label: "前日比" },
  { value: "3d", label: "3日間" },
  { value: "7d", label: "7日間" },
];

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "spotify", label: "Spotify" },
  { value: "youtube", label: "YouTube" },
];

const WINDOW_DAYS: Record<WindowSize, number> = {
  "1d": 1,
  "3d": 3,
  "7d": 7,
};

interface ImpactRow {
  date: string;
  beforeDate: string;
  title: string;
  category: string;
  delta: number;
  pct: number;
}

function getMetricValue(record: ListenerRecord, metric: Metric): number | undefined {
  return metric === "spotify" ? record.monthly_listeners : record.youtube_subscribers;
}

function calcImpact(
  records: ListenerRecord[],
  annotations: Annotation[],
  window: WindowSize,
  metric: Metric,
): ImpactRow[] {
  if (!annotations.length || records.length < 2) return [];

  const days = WINDOW_DAYS[window];
  const byDate = new Map<string, number>();
  records.forEach((r, i) => byDate.set(r.date, i));

  const out: ImpactRow[] = [];

  for (const ann of annotations) {
    const curIdx = byDate.get(ann.date);
    if (curIdx === undefined) continue;

    const beforeIdx = curIdx - days;
    if (beforeIdx < 0) continue;

    const cur = getMetricValue(records[curIdx], metric);
    const before = getMetricValue(records[beforeIdx], metric);
    if (cur === undefined || before === undefined || before === 0) continue;

    const delta = cur - before;
    const pct = (delta / before) * 100;

    out.push({
      date: ann.date,
      beforeDate: records[beforeIdx].date,
      title: ann.title,
      category: ann.category,
      delta,
      pct,
    });
  }

  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 12);
}

export function AnnotationImpact({ records, annotations }: AnnotationImpactProps) {
  const [window, setWindow] = useState<WindowSize>("1d");
  const [metric, setMetric] = useState<Metric>("spotify");

  const hasYoutube = useMemo(
    () => records.some((r) => r.youtube_subscribers !== undefined),
    [records],
  );

  const rows = useMemo(
    () => calcImpact(records, annotations ?? [], window, metric),
    [records, annotations, window, metric],
  );

  if (!annotations?.length || records.length < 2) return null;

  return (
    <div className="annotation-impact-section">
      <span className="chart-section-title">イベント影響度</span>
      <div className="annotation-impact-controls">
        <p className="annotation-impact-hint">
          {metric === "spotify" ? "Spotify月間リスナー" : "YouTube登録者"}の差分（影響度順）
        </p>
        <div className="annotation-impact-toggles">
          {hasYoutube && (
            <div className="range-filter">
              {METRIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`range-btn ${metric === opt.value ? "range-btn--active" : ""}`}
                  onClick={() => setMetric(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <div className="range-filter">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`range-btn ${window === opt.value ? "range-btn--active" : ""}`}
                onClick={() => setWindow(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="annotation-impact-hint">該当期間にデータがありません</p>
      ) : (
        <ul className="annotation-impact-list">
          {rows.map((row) => (
            <li key={`${row.date}-${row.title}`} className="annotation-impact-item">
              <span className="annotation-impact-date">
                {row.beforeDate} → {row.date}
              </span>
              <span className={`annotation-impact-delta ${row.delta >= 0 ? "positive" : "negative"}`}>
                {formatDelta(row.delta)}
              </span>
              <span className={`annotation-impact-pct ${row.pct >= 0 ? "positive" : "negative"}`}>
                {row.pct >= 0 ? "+" : ""}{row.pct.toFixed(2)}%
              </span>
              <span className="annotation-impact-meta">
                {row.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
