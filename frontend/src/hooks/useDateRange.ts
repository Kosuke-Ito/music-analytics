import { useState, useMemo } from "react";
import type { ListenerRecord } from "../types";

export type DateRange = "7d" | "30d" | "90d" | "all";

const VALID_RANGES: DateRange[] = ["7d", "30d", "90d", "all"];
const RANGE_DAYS: Record<DateRange, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

function getInitialRange(): DateRange {
  const params = new URLSearchParams(window.location.search);
  const v = params.get("range");
  if (v && VALID_RANGES.includes(v as DateRange)) return v as DateRange;
  return "30d";
}

function applyRangeToUrl(range: DateRange) {
  const url = new URL(window.location.href);
  if (range === "30d") {
    url.searchParams.delete("range");
  } else {
    url.searchParams.set("range", range);
  }
  const path = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", path);
}

export function useDateRange(records: ListenerRecord[]) {
  const [range, setRangeState] = useState<DateRange>(getInitialRange);

  const setRange = (r: DateRange) => {
    setRangeState(r);
    applyRangeToUrl(r);
  };

  const filteredRecords = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days === null || records.length <= days) return records;
    return records.slice(-days);
  }, [records, range]);

  return { range, setRange, filteredRecords };
}
