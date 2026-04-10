import type { CityListeners, ListenerRecord } from "../types";

export function isJapan(country: string): boolean {
  return country === "JP";
}

export function aggregateByCountry(
  cities: CityListeners[],
): { country: string; listeners: number }[] {
  const map = new Map<string, number>();
  for (const c of cities) {
    map.set(c.country, (map.get(c.country) ?? 0) + c.listeners);
  }
  return [...map.entries()]
    .map(([country, listeners]) => ({ country, listeners }))
    .sort((a, b) => b.listeners - a.listeners);
}

export function calcOverseasRatio(cities: CityListeners[]): number {
  if (cities.length === 0) return 0;
  let total = 0;
  let overseas = 0;
  for (const c of cities) {
    total += c.listeners;
    if (!isJapan(c.country)) overseas += c.listeners;
  }
  return total === 0 ? 0 : (overseas / total) * 100;
}

export interface CityTimeSeries {
  dates: string[];
  cities: {
    city: string;
    country: string;
    values: (number | null)[];
    deltas: (number | null)[];
  }[];
}

export function buildCityTimeSeries(records: ListenerRecord[]): CityTimeSeries {
  const dates = records.filter((r) => r.top_cities?.length).map((r) => r.date);
  if (dates.length === 0) return { dates: [], cities: [] };

  // Collect all unique cities across all records
  const cityKeys = new Map<string, { city: string; country: string }>();
  for (const r of records) {
    for (const c of r.top_cities ?? []) {
      const key = `${c.city}-${c.country}`;
      if (!cityKeys.has(key)) cityKeys.set(key, { city: c.city, country: c.country });
    }
  }

  // Build values array for each city
  const cities = [...cityKeys.entries()].map(([key, info]) => {
    const values = records
      .filter((r) => r.top_cities?.length)
      .map((r) => {
        const match = r.top_cities!.find(
          (c) => `${c.city}-${c.country}` === key,
        );
        return match?.listeners ?? null;
      });
    const deltas = values.map((v, i) => {
      if (i === 0 || v === null || values[i - 1] === null) return null;
      return v - values[i - 1]!;
    });
    return { ...info, values, deltas };
  });

  // Sort by total listeners (descending)
  cities.sort((a, b) => {
    const sumA = a.values.reduce<number>((s, v) => s + (v ?? 0), 0);
    const sumB = b.values.reduce<number>((s, v) => s + (v ?? 0), 0);
    return sumB - sumA;
  });

  return { dates, cities };
}
