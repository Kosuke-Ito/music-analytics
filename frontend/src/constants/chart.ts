import type { CSSProperties } from "react";

export const TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  borderRadius: 8,
  color: "var(--chart-tooltip-text)",
  fontFamily: "var(--font-mono)",
};

export const CHART_COLORS = {
  spotify: "var(--chart-spotify)",
  youtube: "var(--chart-youtube)",
  ma7: "var(--chart-ma7)",
  deltaUp: "var(--positive)",
  deltaDown: "var(--negative)",
};

export const GRID_STROKE = "var(--chart-grid)";

export const TICK_STYLE = {
  fill: "var(--chart-tick)",
  fontFamily: "var(--font-mono)",
};

export const LABEL_STYLE = {
  color: "var(--chart-tick)",
  marginBottom: 4,
  fontSize: 11,
};

export const ACTIVE_DOT_STROKE = "var(--chart-tooltip-bg)";

export const ARTIST_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7",
];
