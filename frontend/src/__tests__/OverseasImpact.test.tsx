import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OverseasImpact } from "../components/OverseasImpact";
import type { ListenerRecord } from "../types";

const emptyRecords: ListenerRecord[] = [
  {
    date: "2026-03-30",
    monthly_listeners: 30000,
    collected_at: "2026-03-30T00:05:00+00:00",
  },
];

const recordsWithCities: ListenerRecord[] = [
  {
    date: "2026-03-31",
    monthly_listeners: 30000,
    collected_at: "2026-03-31T00:05:00+00:00",
    top_cities: [
      { city: "Tokyo", country: "JP", listeners: 200_000 },
      { city: "Taipei", country: "TW", listeners: 100_000 },
    ],
  },
];

describe("OverseasImpact", () => {
  it("top_citiesが無ければ何も表示しない", () => {
    const { container } = render(<OverseasImpact records={emptyRecords} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("top_citiesがあれば国内/海外比率を表示する", () => {
    render(<OverseasImpact records={recordsWithCities} />);
    expect(screen.getByText("海外インパクト分析")).toBeInTheDocument();
    expect(screen.getAllByText(/国内/).length).toBeGreaterThan(0);
  });

  it("top_citiesが空→非空に変わってもクラッシュしない（rules-of-hooks回帰テスト）", () => {
    const { rerender } = render(<OverseasImpact records={emptyRecords} />);
    expect(() =>
      rerender(<OverseasImpact records={recordsWithCities} />)
    ).not.toThrow();
    expect(screen.getByText("海外インパクト分析")).toBeInTheDocument();
  });
});
