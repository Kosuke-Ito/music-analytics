import { useEffect, useState } from "react";
import type { ArtistData } from "../types";

interface UseArtistDataResult {
  data: ArtistData | null;
  loading: boolean;
  error: string | null;
}

interface FetchState {
  artistId: string;
  data: ArtistData | null;
  error: string | null;
}

export function useArtistData(artistId: string): UseArtistDataResult {
  // loading は「現在の artistId の結果がまだ無い」ことから導出する
  // （effect 内の同期 setState によるリセットを避ける）
  // A→B→A と戻った場合は前回の A の結果を再fetch完了まで表示する（SWR 的挙動、意図どおり）
  const [state, setState] = useState<FetchState | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/data/${artistId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setState({ artistId, data: json, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ artistId, data: null, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [artistId]);

  const current = state?.artistId === artistId ? state : null;
  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
  };
}
