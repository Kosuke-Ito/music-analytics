import type { ListenerRecord } from "../types";

export type Granularity = "daily" | "weekly" | "monthly";

/** Returns the Monday of the week containing the given date (YYYY-MM-DD). */
function getWeekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday-based
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Returns the first day of the month containing the given date. */
function getMonthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function getBucketKey(date: string, granularity: Granularity): string {
  if (granularity === "weekly") return getWeekStart(date);
  if (granularity === "monthly") return getMonthStart(date);
  return date;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((s, v) => s + v, 0);
  return Math.round(sum / values.length);
}

function avgOptional(values: (number | undefined)[]): number | undefined {
  const defined = values.filter((v): v is number => v !== undefined);
  if (defined.length === 0) return undefined;
  return avg(defined);
}

export function aggregateRecords(
  records: ListenerRecord[],
  granularity: Granularity,
): ListenerRecord[] {
  if (granularity === "daily") return records;
  if (records.length === 0) return [];

  const buckets = new Map<string, ListenerRecord[]>();
  for (const r of records) {
    const key = getBucketKey(r.date, granularity);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  const sortedKeys = [...buckets.keys()].sort();
  return sortedKeys.map((key) => {
    const bucket = buckets.get(key)!;
    const last = bucket[bucket.length - 1];
    return {
      date: key,
      monthly_listeners: avg(bucket.map((r) => r.monthly_listeners)),
      spotify_followers: avgOptional(bucket.map((r) => r.spotify_followers)),
      youtube_subscribers: avgOptional(bucket.map((r) => r.youtube_subscribers)),
      youtube_total_views: avgOptional(bucket.map((r) => r.youtube_total_views)),
      lastfm_listeners: avgOptional(bucket.map((r) => r.lastfm_listeners)),
      lastfm_playcount: avgOptional(bucket.map((r) => r.lastfm_playcount)),
      top_cities: last.top_cities,
      collected_at: last.collected_at,
    };
  });
}
