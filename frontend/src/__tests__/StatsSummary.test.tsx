import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatsSummary } from "../components/StatsSummary";
import type { ListenerRecord } from "../types";

const records: ListenerRecord[] = [
  {
    date: "2026-03-29",
    monthly_listeners: 31000,
    collected_at: "2026-03-29T00:05:00+00:00",
  },
  {
    date: "2026-03-30",
    monthly_listeners: 30000,
    collected_at: "2026-03-30T00:05:00+00:00",
  },
  {
    date: "2026-03-31",
    monthly_listeners: 28970,
    collected_at: "2026-03-31T00:05:00+00:00",
  },
];

describe("StatsSummary", () => {
  it("現在のリスナー数を表示する", () => {
    render(<StatsSummary records={records} />);
    expect(screen.getByText("28,970")).toBeInTheDocument();
  });

  it("前日比の変化量を表示する", () => {
    render(<StatsSummary records={records} />);
    // 28970 - 30000 = -1030
    expect(screen.getByText(/-1,030/)).toBeInTheDocument();
  });

  it("レコードが1件のみの場合でも表示できる", () => {
    render(<StatsSummary records={[records[0]]} />);
    expect(screen.getByText("31,000")).toBeInTheDocument();
  });

  it("空のレコードでも壊れない", () => {
    render(<StatsSummary records={[]} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
