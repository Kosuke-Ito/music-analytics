import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDateRange } from "../hooks/useDateRange";
import type { ListenerRecord } from "../types";

function makeRecords(days: number): ListenerRecord[] {
  const records: ListenerRecord[] = [];
  const now = new Date("2026-04-10");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    records.push({
      date: d.toISOString().slice(0, 10),
      monthly_listeners: 1000 + i,
      collected_at: d.toISOString(),
    });
  }
  return records;
}

const dailyCounts = { short: 7, medium: 30, long: 90 };

describe("useDateRange", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("defaults to medium", () => {
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records, dailyCounts));
    expect(result.current.range).toBe("medium");
    expect(result.current.filteredRecords).toHaveLength(30);
  });

  it("filters to short (7 items)", () => {
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records, dailyCounts));
    act(() => result.current.setRange("short"));
    expect(result.current.filteredRecords).toHaveLength(7);
  });

  it("filters to long (90 items)", () => {
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records, dailyCounts));
    act(() => result.current.setRange("long"));
    expect(result.current.filteredRecords).toHaveLength(90);
  });

  it("returns all items when range is all", () => {
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records, dailyCounts));
    act(() => result.current.setRange("all"));
    expect(result.current.filteredRecords).toHaveLength(100);
  });

  it("returns all when fewer items than count", () => {
    const records = makeRecords(5);
    const { result } = renderHook(() => useDateRange(records, dailyCounts));
    expect(result.current.filteredRecords).toHaveLength(5);
  });

  it("reads range from URL parameter", () => {
    window.history.replaceState({}, "", "/?range=short");
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records, dailyCounts));
    expect(result.current.range).toBe("short");
    expect(result.current.filteredRecords).toHaveLength(7);
  });

  it("ignores invalid URL parameter and defaults to medium", () => {
    window.history.replaceState({}, "", "/?range=invalid");
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records, dailyCounts));
    expect(result.current.range).toBe("medium");
  });

  it("supports custom counts (weekly)", () => {
    const records = makeRecords(100);
    const weeklyCounts = { short: 4, medium: 12, long: 24 };
    const { result } = renderHook(() => useDateRange(records, weeklyCounts));
    expect(result.current.filteredRecords).toHaveLength(12);
    act(() => result.current.setRange("short"));
    expect(result.current.filteredRecords).toHaveLength(4);
  });
});
