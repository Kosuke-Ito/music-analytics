import { describe, it, expect } from "vitest";
import {
  calculateRetentionScore,
  calculateYouTubeEfficiency,
  calculateWeeklyGrowth,
} from "../utils/metrics";
import type { ListenerRecord } from "../types";

describe("calculateRetentionScore", () => {
  it("フォロワー/リスナーの比率をパーセントで返す", () => {
    expect(calculateRetentionScore(500000, 1000000)).toBeCloseTo(50.0);
  });

  it("小さい値でも正しく計算する", () => {
    expect(calculateRetentionScore(17300, 28000)).toBeCloseTo(61.8, 0);
  });

  it("リスナー0の場合はnullを返す", () => {
    expect(calculateRetentionScore(100, 0)).toBeNull();
  });

  it("フォロワーがundefinedの場合はnullを返す", () => {
    expect(calculateRetentionScore(undefined as unknown as number, 1000)).toBeNull();
  });
});

describe("calculateYouTubeEfficiency", () => {
  it("再生回数/登録者数の比率を返す", () => {
    expect(calculateYouTubeEfficiency(3000000000, 10000000)).toBeCloseTo(300.0);
  });

  it("登録者0の場合はnullを返す", () => {
    expect(calculateYouTubeEfficiency(1000000, 0)).toBeNull();
  });

  it("再生回数がundefinedの場合はnullを返す", () => {
    expect(calculateYouTubeEfficiency(undefined as unknown as number, 1000)).toBeNull();
  });
});

describe("calculateWeeklyGrowth", () => {
  const makeRecords = (values: number[]): ListenerRecord[] =>
    values.map((v, i) => ({
      date: `2026-04-${String(i + 1).padStart(2, "0")}`,
      monthly_listeners: v,
      collected_at: "",
    }));

  it("8件以上で週間成長率を計算する", () => {
    const records = makeRecords([100000, 101000, 102000, 103000, 104000, 105000, 106000, 110000]);
    // (110000 - 100000) / 100000 * 100 = 10%
    expect(calculateWeeklyGrowth(records)).toBeCloseTo(10.0);
  });

  it("7件以下はnullを返す", () => {
    const records = makeRecords([100000, 101000, 102000]);
    expect(calculateWeeklyGrowth(records)).toBeNull();
  });

  it("マイナス成長も正しく計算する", () => {
    const records = makeRecords([100000, 99000, 98000, 97000, 96000, 95000, 94000, 90000]);
    // (90000 - 100000) / 100000 * 100 = -10%
    expect(calculateWeeklyGrowth(records)).toBeCloseTo(-10.0);
  });
});
