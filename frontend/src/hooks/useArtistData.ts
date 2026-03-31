import { useEffect, useState } from "react";
import type { ArtistData } from "../types";

interface UseArtistDataResult {
  data: ArtistData | null;
  loading: boolean;
  error: string | null;
}

export function useArtistData(artistId: string): UseArtistDataResult {
  const [data, setData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/data/${artistId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [artistId]);

  return { data, loading, error };
}
