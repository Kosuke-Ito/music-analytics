import { describe, it, expect } from "vitest";
import { aggregateRecords } from "../utils/aggregate";
import type { ListenerRecord } from "../types";

function makeRecord(date: string, listeners: number): ListenerRecord {
  return {
    date,
    monthly_listeners: listeners,
    collected_at: `${date}T00:00:00Z`,
  };
}

describe("aggregateRecords", () => {
  it("returns records as-is for daily granularity", () => {
    const records = [
      makeRecord("2026-04-08", 100),
      makeRecord("2026-04-09", 200),
    ];
    expect(aggregateRecords(records, "daily")).toEqual(records);
  });

  it("aggregates to weekly average (Monday-based week)", () => {
    // 2026-04-06 = Monday
    const records = [
      makeRecord("2026-04-06", 100), // Mon
      makeRecord("2026-04-07", 200), // Tue
      makeRecord("2026-04-08", 300), // Wed
      makeRecord("2026-04-13", 400), // Mon next week
      makeRecord("2026-04-14", 500), // Tue
    ];
    const result = aggregateRecords(records, "weekly");
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-04-06");
    expect(result[0].monthly_listeners).toBe(200); // (100+200+300)/3
    expect(result[1].date).toBe("2026-04-13");
    expect(result[1].monthly_listeners).toBe(450); // (400+500)/2
  });

  it("aggregates to monthly average", () => {
    const records = [
      makeRecord("2026-03-15", 100),
      makeRecord("2026-03-20", 200),
      makeRecord("2026-04-01", 300),
      makeRecord("2026-04-10", 500),
    ];
    const result = aggregateRecords(records, "monthly");
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-03-01");
    expect(result[0].monthly_listeners).toBe(150); // (100+200)/2
    expect(result[1].date).toBe("2026-04-01");
    expect(result[1].monthly_listeners).toBe(400); // (300+500)/2
  });

  it("returns empty array for empty input", () => {
    expect(aggregateRecords([], "weekly")).toEqual([]);
  });

  it("rounds averages to integer", () => {
    const records = [
      makeRecord("2026-04-06", 100),
      makeRecord("2026-04-07", 101),
      makeRecord("2026-04-08", 101),
    ];
    const result = aggregateRecords(records, "weekly");
    expect(result[0].monthly_listeners).toBe(101); // round(100.67)
  });

  it("includes spotify_followers and youtube fields if available", () => {
    const records: ListenerRecord[] = [
      {
        date: "2026-04-06",
        monthly_listeners: 100,
        spotify_followers: 1000,
        youtube_subscribers: 500,
        collected_at: "2026-04-06T00:00:00Z",
      },
      {
        date: "2026-04-07",
        monthly_listeners: 200,
        spotify_followers: 1100,
        youtube_subscribers: 600,
        collected_at: "2026-04-07T00:00:00Z",
      },
    ];
    const result = aggregateRecords(records, "weekly");
    expect(result[0].spotify_followers).toBe(1050);
    expect(result[0].youtube_subscribers).toBe(550);
  });
});
