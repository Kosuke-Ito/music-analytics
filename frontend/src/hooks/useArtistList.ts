import { useEffect, useState } from "react";
import type { ArtistConfig } from "../types";

interface UseArtistListResult {
  artists: ArtistConfig[];
  loading: boolean;
  error: string | null;
}

export function useArtistList(): UseArtistListResult {
  const [artists, setArtists] = useState<ArtistConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/config.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setArtists(json.artists);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { artists, loading, error };
}
