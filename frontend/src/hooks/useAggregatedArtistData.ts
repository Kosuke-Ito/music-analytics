import { useEffect, useMemo, useState } from "react";
import type { ArtistData } from "../types";

interface UseAggregatedArtistDataResult {
  dataById: Record<string, ArtistData>;
  loading: boolean;
  error: string | null;
}

interface FetchState {
  key: string;
  dataById: Record<string, ArtistData>;
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
  // loading やリセットは「現在の sortedKey の結果があるか」から導出する
  // （effect 内の同期 setState によるリセットを避ける）
  const [state, setState] = useState<FetchState | null>(null);

  useEffect(() => {
    if (!enabled || sortedKey.length === 0) return;

    const ids = sortedKey.split(",");

    let cancelled = false;

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

      setState({
        key: sortedKey,
        dataById: map,
        error: failed === ids.length ? "全アーティストのデータ取得に失敗しました" : null,
      });
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, sortedKey]);

  const active = enabled && sortedKey.length > 0;
  const current = active && state?.key === sortedKey ? state : null;
  return {
    dataById: current?.dataById ?? {},
    loading: active && current === null,
    error: current?.error ?? null,
  };
}
