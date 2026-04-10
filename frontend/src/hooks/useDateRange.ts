import { useState, useMemo } from "react";

export type DateRange = "short" | "medium" | "long" | "all";

const VALID_RANGES: DateRange[] = ["short", "medium", "long", "all"];

export interface RangeCounts {
  short: number;
  medium: number;
  long: number;
}

function getInitialRange(): DateRange {
  const params = new URLSearchParams(window.location.search);
  const v = params.get("range");
  if (v && VALID_RANGES.includes(v as DateRange)) return v as DateRange;
  return "medium";
}

function applyRangeToUrl(range: DateRange) {
  const url = new URL(window.location.href);
  if (range === "medium") {
    url.searchParams.delete("range");
  } else {
    url.searchParams.set("range", range);
  }
  const path = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", path);
}

export function useDateRange<T>(items: T[], counts: RangeCounts) {
  const [range, setRangeState] = useState<DateRange>(getInitialRange);

  const setRange = (r: DateRange) => {
    setRangeState(r);
    applyRangeToUrl(r);
  };

  const filteredRecords = useMemo(() => {
    if (range === "all") return items;
    const count = counts[range];
    return items.length <= count ? items : items.slice(-count);
  }, [items, range, counts]);

  return { range, setRange, filteredRecords };
}
