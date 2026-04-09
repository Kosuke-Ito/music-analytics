import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ListenerChart } from "../components/ListenerChart";
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

describe("ListenerChart", () => {
  it("チャートコンテナがレンダリングされる", () => {
    const { container } = render(
      <ListenerChart records={records} visibleAnnotations={[]} hoveredAnnotation={null} onHoverAnnotation={() => {}} />
    );
    // ResponsiveContainerはjsdomでwidthを計算できないので、外側のdivを確認
    expect(container.querySelector(".chart-container")).toBeInTheDocument();
  });

  it("レコードが空の場合はメッセージを表示", () => {
    render(
      <ListenerChart records={[]} visibleAnnotations={[]} hoveredAnnotation={null} onHoverAnnotation={() => {}} />
    );
    expect(screen.getByText(/データがありません/)).toBeInTheDocument();
  });
});
