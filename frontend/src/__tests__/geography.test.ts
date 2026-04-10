import { describe, it, expect } from "vitest";
import {
  isJapan,
  aggregateByCountry,
  calcOverseasRatio,
  buildCityTimeSeries,
} from "../utils/geography";
import type { CityListeners, ListenerRecord } from "../types";

const cities: CityListeners[] = [
  { city: "Osaka", country: "JP", listeners: 300_000 },
  { city: "Tokyo", country: "JP", listeners: 200_000 },
  { city: "Nagoya", country: "JP", listeners: 150_000 },
  { city: "Taipei", country: "TW", listeners: 80_000 },
  { city: "Seoul", country: "KR", listeners: 50_000 },
];

describe("isJapan", () => {
  it("returns true for JP", () => {
    expect(isJapan("JP")).toBe(true);
  });
  it("returns false for other countries", () => {
    expect(isJapan("US")).toBe(false);
    expect(isJapan("KR")).toBe(false);
  });
});

describe("aggregateByCountry", () => {
  it("sums listeners by country", () => {
    const result = aggregateByCountry(cities);
    expect(result).toEqual([
      { country: "JP", listeners: 650_000 },
      { country: "TW", listeners: 80_000 },
      { country: "KR", listeners: 50_000 },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(aggregateByCountry([])).toEqual([]);
  });
});

describe("calcOverseasRatio", () => {
  it("calculates overseas percentage", () => {
    const ratio = calcOverseasRatio(cities);
    // overseas = 80000 + 50000 = 130000, total = 780000
    expect(ratio).toBeCloseTo(130_000 / 780_000 * 100, 1);
  });

  it("returns 0 for empty input", () => {
    expect(calcOverseasRatio([])).toBe(0);
  });

  it("returns 100 for all overseas", () => {
    const overseas: CityListeners[] = [
      { city: "NYC", country: "US", listeners: 100 },
    ];
    expect(calcOverseasRatio(overseas)).toBe(100);
  });
});

describe("buildCityTimeSeries", () => {
  const records: ListenerRecord[] = [
    {
      date: "2026-04-08",
      monthly_listeners: 1000,
      collected_at: "2026-04-08T00:00:00Z",
      top_cities: [
        { city: "Osaka", country: "JP", listeners: 300 },
        { city: "Tokyo", country: "JP", listeners: 200 },
      ],
    },
    {
      date: "2026-04-09",
      monthly_listeners: 1000,
      collected_at: "2026-04-09T00:00:00Z",
      top_cities: [
        { city: "Osaka", country: "JP", listeners: 310 },
        { city: "Seoul", country: "KR", listeners: 100 },
      ],
    },
    {
      date: "2026-04-10",
      monthly_listeners: 1000,
      collected_at: "2026-04-10T00:00:00Z",
      top_cities: [
        { city: "Osaka", country: "JP", listeners: 320 },
        { city: "Tokyo", country: "JP", listeners: 210 },
        { city: "Seoul", country: "KR", listeners: 110 },
      ],
    },
  ];

  it("builds time series for cities appearing in data", () => {
    const series = buildCityTimeSeries(records);
    expect(series.dates).toEqual(["2026-04-08", "2026-04-09", "2026-04-10"]);

    const osaka = series.cities.find((c) => c.city === "Osaka");
    expect(osaka?.values).toEqual([300, 310, 320]);

    const tokyo = series.cities.find((c) => c.city === "Tokyo");
    expect(tokyo?.values).toEqual([200, null, 210]);

    const seoul = series.cities.find((c) => c.city === "Seoul");
    expect(seoul?.values).toEqual([null, 100, 110]);
  });

  it("computes deltas between consecutive values", () => {
    const series = buildCityTimeSeries(records);

    const osaka = series.cities.find((c) => c.city === "Osaka");
    // 300→310(+10), 310→320(+10)
    expect(osaka?.deltas).toEqual([null, 10, 10]);

    const tokyo = series.cities.find((c) => c.city === "Tokyo");
    // 200→null(null), null→210(null)
    expect(tokyo?.deltas).toEqual([null, null, null]);

    const seoul = series.cities.find((c) => c.city === "Seoul");
    // null→100(null), 100→110(+10)
    expect(seoul?.deltas).toEqual([null, null, 10]);
  });

  it("returns empty for no records", () => {
    const series = buildCityTimeSeries([]);
    expect(series.dates).toEqual([]);
    expect(series.cities).toEqual([]);
  });
});
