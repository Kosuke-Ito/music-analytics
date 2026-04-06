import type { Annotation } from "../types";

interface AnnotationListProps {
  annotations?: Annotation[];
}

const CATEGORY_LABELS: Record<string, string> = {
  release: "Release",
  viral: "Viral",
  collab: "Collab",
  tour: "Tour",
  award: "Award",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  release: "#f6ad55",
  viral: "#fc8181",
  collab: "#90cdf4",
  tour: "#9ae6b4",
  award: "#fefcbf",
  other: "#a0aec0",
};

export function AnnotationList({ annotations }: AnnotationListProps) {
  if (!annotations?.length) return null;

  return (
    <div className="annotation-section">
      <span className="chart-section-title">News & Events</span>
      <ul className="annotation-list">
        {annotations.map((ann, i) => (
          <li key={`${ann.date}-${ann.title}`} className="annotation-item">
            <span
              className="annotation-number"
              style={{ color: CATEGORY_COLORS[ann.category] ?? CATEGORY_COLORS.other }}
            >
              {i + 1}
            </span>
            <span className="annotation-date">{ann.date}</span>
            <span className={`annotation-category annotation-category--${ann.category}`}>
              {CATEGORY_LABELS[ann.category] ?? ann.category}
            </span>
            <span className="annotation-title">
              {ann.url ? (
                <a href={ann.url} target="_blank" rel="noopener noreferrer">
                  {ann.title}
                </a>
              ) : (
                ann.title
              )}
            </span>
            {ann.description && (
              <p className="annotation-desc">{ann.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
