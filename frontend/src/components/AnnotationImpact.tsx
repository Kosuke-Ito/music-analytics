import { useMemo } from "react";
import type { Annotation, ListenerRecord } from "../types";
import { formatDelta } from "../utils/format";

interface AnnotationImpactProps {
  records: ListenerRecord[];
  annotations?: Annotation[];
}

/**
 * アノテーション日付と一致する日次レコードがあれば、前日比のリスナー変化を表示する。
 */
export function AnnotationImpact({ records, annotations }: AnnotationImpactProps) {
  const rows = useMemo(() => {
    if (!annotations?.length || records.length < 2) return [];

    const byDate = new Map<string, { index: number; listeners: number }>();
    records.forEach((r, index) => {
      byDate.set(r.date, { index, listeners: r.monthly_listeners });
    });

    const out: {
      date: string;
      title: string;
      category: string;
      delta: number;
      prevDate: string;
    }[] = [];

    for (const ann of annotations) {
      const cur = byDate.get(ann.date);
      if (!cur || cur.index < 1) continue;
      const prev = records[cur.index - 1];
      if (!prev) continue;
      const delta = cur.listeners - prev.monthly_listeners;
      out.push({
        date: ann.date,
        title: ann.title,
        category: ann.category,
        delta,
        prevDate: prev.date,
      });
    }

    return out.slice(-12);
  }, [records, annotations]);

  if (rows.length === 0) return null;

  return (
    <div className="annotation-impact-section">
      <span className="chart-section-title">Event day vs previous day</span>
      <p className="annotation-impact-hint">
        アノテーション日付の Spotify 月間リスナーと、その直前の記録日との差分です。
      </p>
      <ul className="annotation-impact-list">
        {rows.map((row) => (
          <li key={`${row.date}-${row.title}`} className="annotation-impact-item">
            <span className="annotation-impact-date">{row.date}</span>
            <span className={`annotation-impact-delta ${row.delta >= 0 ? "positive" : "negative"}`}>
              {formatDelta(row.delta)}
            </span>
            <span className="annotation-impact-meta">
              vs {row.prevDate} · {row.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
