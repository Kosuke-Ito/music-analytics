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

describe("useDateRange", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("defaults to 30d", () => {
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records));
    expect(result.current.range).toBe("30d");
    expect(result.current.filteredRecords).toHaveLength(30);
  });

  it("filters to 7 days", () => {
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records));
    act(() => result.current.setRange("7d"));
    expect(result.current.filteredRecords).toHaveLength(7);
  });

  it("filters to 90 days", () => {
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records));
    act(() => result.current.setRange("90d"));
    expect(result.current.filteredRecords).toHaveLength(90);
  });

  it("shows all records", () => {
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records));
    act(() => result.current.setRange("all"));
    expect(result.current.filteredRecords).toHaveLength(100);
  });

  it("returns all records when fewer than range", () => {
    const records = makeRecords(10);
    const { result } = renderHook(() => useDateRange(records));
    expect(result.current.range).toBe("30d");
    expect(result.current.filteredRecords).toHaveLength(10);
  });

  it("reads range from URL parameter", () => {
    window.history.replaceState({}, "", "/?range=7d");
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records));
    expect(result.current.range).toBe("7d");
    expect(result.current.filteredRecords).toHaveLength(7);
  });

  it("ignores invalid URL parameter and defaults to 30d", () => {
    window.history.replaceState({}, "", "/?range=invalid");
    const records = makeRecords(100);
    const { result } = renderHook(() => useDateRange(records));
    expect(result.current.range).toBe("30d");
  });
});
