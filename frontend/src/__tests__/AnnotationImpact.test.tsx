import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AnnotationImpact } from "../components/AnnotationImpact";
import type { ListenerRecord, Annotation } from "../types";

const records: ListenerRecord[] = [
  { date: "2026-04-01", monthly_listeners: 1_000_000, collected_at: "2026-04-01T00:00:00Z" },
  { date: "2026-04-02", monthly_listeners: 1_001_000, collected_at: "2026-04-02T00:00:00Z" },
  { date: "2026-04-03", monthly_listeners: 1_002_000, collected_at: "2026-04-03T00:00:00Z" },
  { date: "2026-04-04", monthly_listeners: 1_005_000, collected_at: "2026-04-04T00:00:00Z" },
  { date: "2026-04-05", monthly_listeners: 1_050_000, collected_at: "2026-04-05T00:00:00Z" },
];

const annotations: Annotation[] = [
  {
    date: "2026-04-05",
    title: "新曲リリース",
    category: "release",
    description: "",
    url: "",
    added_at: "",
  },
  {
    date: "2026-04-02",
    title: "コラボ発表",
    category: "collab",
    description: "",
    url: "",
    added_at: "",
  },
];

describe("AnnotationImpact", () => {
  it("イベント影響度のセクションを表示する", () => {
    render(<AnnotationImpact records={records} annotations={annotations} />);
    expect(screen.getByText("イベント影響度")).toBeInTheDocument();
  });

  it("アノテーションタイトルを表示する", () => {
    render(<AnnotationImpact records={records} annotations={annotations} />);
    expect(screen.getByText("新曲リリース")).toBeInTheDocument();
  });

  it("annotationsが無い場合は何も表示しない", () => {
    const { container } = render(
      <AnnotationImpact records={records} annotations={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("recordsが1件以下なら何も表示しない", () => {
    const { container } = render(
      <AnnotationImpact records={[records[0]]} annotations={annotations} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("デフォルトはSpotify metric", () => {
    render(<AnnotationImpact records={records} annotations={annotations} />);
    expect(screen.getByText(/Spotify月間リスナー/)).toBeInTheDocument();
  });

  it("3日間のwindowに切り替えできる", () => {
    render(<AnnotationImpact records={records} annotations={annotations} />);
    fireEvent.click(screen.getByText("3日間"));
    // 3日間ボタンがアクティブになる
    expect(screen.getByText("3日間").className).toContain("range-btn--active");
  });

  it("YouTubeデータがある場合は metric 切替が表示される", () => {
    const recordsWithYT: ListenerRecord[] = records.map((r) => ({
      ...r,
      youtube_subscribers: 100_000,
    }));
    render(<AnnotationImpact records={recordsWithYT} annotations={annotations} />);
    expect(screen.getByText("YouTube")).toBeInTheDocument();
    expect(screen.getByText("Spotify")).toBeInTheDocument();
  });

  it("YouTubeデータが無い場合は metric 切替が表示されない", () => {
    render(<AnnotationImpact records={records} annotations={annotations} />);
    expect(screen.queryByText("Spotify")).not.toBeInTheDocument();
  });

  it("比較期間が表示される（before → event date）", () => {
    render(<AnnotationImpact records={records} annotations={annotations} />);
    // 1d なので前日との比較: 04-04 → 04-05
    expect(screen.getByText(/2026-04-04 → 2026-04-05/)).toBeInTheDocument();
  });
});
