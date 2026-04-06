import { useEffect, useMemo, useState } from "react";
import type { ArtistData } from "../types";

interface UseAggregatedArtistDataResult {
  dataById: Record<string, ArtistData>;
  loading: boolean;
  error: string | null;
}

/**
 * アーティストIDごとの JSON を1回のロードでまとめて取得する（一覧の N+1 を避ける）。
 */
export function useAggregatedArtistData(
  artistIds: string[],
  enabled: boolean
): UseAggregatedArtistDataResult {
  const sortedKey = useMemo(() => [...artistIds].sort().join(","), [artistIds]);
  const [dataById, setDataById] = useState<Record<string, ArtistData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || sortedKey.length === 0) {
      setDataById({});
      setLoading(false);
      setError(null);
      return;
    }

    const ids = sortedKey.split(",");

    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/data/${id}.json`);
            if (!res.ok) return { id, data: null as ArtistData | null };
            const json = (await res.json()) as ArtistData;
            return { id, data: json };
          } catch {
            return { id, data: null as ArtistData | null };
          }
        })
      );

      if (cancelled) return;

      const map: Record<string, ArtistData> = {};
      let failed = 0;
      for (const { id, data } of results) {
        if (data) map[id] = data;
        else failed += 1;
      }

      setDataById(map);
      setLoading(false);
      if (failed === ids.length) {
        setError("全アーティストのデータ取得に失敗しました");
      } else if (failed > 0) {
        setError(null);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, sortedKey]);

  return { dataById, loading, error };
}
