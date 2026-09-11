import { useState, useEffect, useCallback, useMemo } from "react";
import type { ArtistConfig } from "../types";
import { applyArtistToUrl, getArtistIdFromSearch } from "../urlArtist";

export function useUrlSync(artists: ArtistConfig[]) {
  // ユーザー（または URL）が選んだ ID。有効性の判定は selectedId の導出側で行う
  // （無効な ID もそのまま保持する。後から artists に同じ ID が追加された場合に
  //   選択が移る可能性があるが、日次更新の artists では実質発生しないため許容）
  const [chosenId, setChosenId] = useState<string | null>(() =>
    getArtistIdFromSearch(window.location.search)
  );

  // 無効な ID や未選択はデフォルト（最初のアーティスト）へフォールバック
  const selectedId = useMemo(() => {
    if (artists.length === 0) return null;
    if (chosenId && artists.some((a) => a.id === chosenId)) return chosenId;
    return artists[0].id;
  }, [artists, chosenId]);

  // URL が選択と食い違っていたら正規化（初期表示でのデフォルト反映など）
  useEffect(() => {
    if (!selectedId) return;
    if (getArtistIdFromSearch(window.location.search) !== selectedId) {
      applyArtistToUrl(selectedId, "replace");
    }
  }, [selectedId]);

  // 戻る/進む対応
  useEffect(() => {
    const onPopState = () => {
      const id = getArtistIdFromSearch(window.location.search);
      if (!id || artists.length === 0) return;
      if (!artists.some((a) => a.id === id)) return;
      setChosenId(id);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [artists]);

  const selectArtist = useCallback((id: string) => {
    setChosenId(id);
    applyArtistToUrl(id, "push");
  }, []);

  return { selectedId, selectArtist };
}
