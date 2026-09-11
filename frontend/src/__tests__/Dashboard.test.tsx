import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dashboard } from "../components/Dashboard";
import type { ArtistData } from "../types";

const stubData: ArtistData = {
  artist_id: "s1",
  artist_name: "LAUSBUB",
  records: [
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
  ],
};

describe("Dashboard", () => {
  it("data が undefined ならエラーメッセージを表示する", () => {
    render(<Dashboard artistId="lausbub" />);
    expect(screen.getByText(/データがありません/)).toBeTruthy();
    expect(screen.getByText("lausbub")).toBeTruthy();
  });

  it("data ありでアーティスト名を表示する", () => {
    render(<Dashboard artistId="lausbub" data={stubData} />);
    expect(screen.getByText("LAUSBUB")).toBeTruthy();
  });

  it("data が undefined → defined に変わってもクラッシュしない（rules-of-hooks 回帰テスト）", () => {
    // 早期returnがHookより前にあった旧実装では、この遷移で
    // "Rendered more hooks than during the previous render" が発生していた
    const { rerender } = render(<Dashboard artistId="lausbub" />);
    expect(screen.getByText(/データがありません/)).toBeTruthy();

    expect(() =>
      rerender(<Dashboard artistId="lausbub" data={stubData} />)
    ).not.toThrow();
    expect(screen.getByText("LAUSBUB")).toBeTruthy();
  });
});
