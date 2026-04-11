import { useState, useEffect, useCallback } from "react";
import type { ArtistConfig } from "../types";
import { applyArtistToUrl, getArtistIdFromSearch } from "../urlArtist";

export function useUrlSync(artists: ArtistConfig[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 初期化: URL から読み取り、無効ならデフォルトで最初のアーティスト
  useEffect(() => {
    if (artists.length === 0) return;
    const fromUrl = getArtistIdFromSearch(window.location.search);
    const valid = fromUrl && artists.some((a) => a.id === fromUrl) ? fromUrl : null;
    if (valid) {
      setSelectedId(valid);
      return;
    }
    const first = artists[0].id;
    setSelectedId(first);
    applyArtistToUrl(first, "replace");
  }, [artists]);

  // 戻る/進む対応
  useEffect(() => {
    const onPopState = () => {
      const id = getArtistIdFromSearch(window.location.search);
      if (!id || artists.length === 0) return;
      if (!artists.some((a) => a.id === id)) return;
      setSelectedId(id);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [artists]);

  const selectArtist = useCallback((id: string) => {
    setSelectedId(id);
    applyArtistToUrl(id, "push");
  }, []);

  return { selectedId, selectArtist };
}
