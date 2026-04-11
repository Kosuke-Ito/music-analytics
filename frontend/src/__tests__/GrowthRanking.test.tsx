import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GrowthRanking } from "../components/GrowthRanking";
import type { ArtistConfig, ArtistData } from "../types";

const artists: ArtistConfig[] = [
  { id: "yoasobi", name: "YOASOBI", spotify_artist_id: "s1" },
  { id: "vaundy", name: "Vaundy", spotify_artist_id: "s2" },
];

const dataById: Record<string, ArtistData> = {
  yoasobi: {
    artist_id: "s1",
    artist_name: "YOASOBI",
    records: [
      { date: "2026-04-04", monthly_listeners: 1_000_000, collected_at: "2026-04-04T00:00:00Z" },
      { date: "2026-04-05", monthly_listeners: 1_100_000, collected_at: "2026-04-05T00:00:00Z" },
    ],
  },
  vaundy: {
    artist_id: "s2",
    artist_name: "Vaundy",
    records: [
      { date: "2026-04-04", monthly_listeners: 500_000, collected_at: "2026-04-04T00:00:00Z" },
      { date: "2026-04-05", monthly_listeners: 510_000, collected_at: "2026-04-05T00:00:00Z" },
    ],
  },
};

describe("GrowthRanking", () => {
  it("ランキングタイトルを表示する", () => {
    render(<GrowthRanking artists={artists} dataById={dataById} onSelect={() => {}} />);
    expect(screen.getByText("Growth Ranking")).toBeInTheDocument();
  });

  it("両アーティストを表示する", () => {
    render(<GrowthRanking artists={artists} dataById={dataById} onSelect={() => {}} />);
    expect(screen.getByText("YOASOBI")).toBeInTheDocument();
    expect(screen.getByText("Vaundy")).toBeInTheDocument();
  });

  it("成長率の高い順にソートされる（YOASOBI: 10% > Vaundy: 2%）", () => {
    render(<GrowthRanking artists={artists} dataById={dataById} onSelect={() => {}} />);
    const cards = screen.getAllByText(/YOASOBI|Vaundy/);
    expect(cards[0].textContent).toBe("YOASOBI");
    expect(cards[1].textContent).toBe("Vaundy");
  });

  it("クリックでonSelectが呼ばれる", () => {
    const onSelect = vi.fn();
    render(<GrowthRanking artists={artists} dataById={dataById} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("YOASOBI"));
    expect(onSelect).toHaveBeenCalledWith("yoasobi");
  });

  it("metric切替（Spotify ↔ YouTube）が動作する", () => {
    render(<GrowthRanking artists={artists} dataById={dataById} onSelect={() => {}} />);
    expect(screen.getByText("Spotify")).toBeInTheDocument();
    expect(screen.getByText("YouTube")).toBeInTheDocument();
  });

  it("dataの無いアーティストは末尾に来る", () => {
    const partialData = { yoasobi: dataById.yoasobi };
    render(<GrowthRanking artists={artists} dataById={partialData} onSelect={() => {}} />);
    // どちらも表示はされる
    expect(screen.getByText("YOASOBI")).toBeInTheDocument();
    expect(screen.getByText("Vaundy")).toBeInTheDocument();
  });
});
