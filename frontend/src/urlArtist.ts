/** ブラウザ履歴と共有するクエリ名 */
export const ARTIST_QUERY = "artist";

export function getArtistIdFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const v = params.get(ARTIST_QUERY);
  return v && v.length > 0 ? v : null;
}

/**
 * @param mode push … 戻るで直前の選択に戻る / replace … 履歴を積まず URL だけ合わせる（初回デフォルト用）
 */
export function applyArtistToUrl(id: string, mode: "push" | "replace"): void {
  const url = new URL(window.location.href);
  url.searchParams.set(ARTIST_QUERY, id);
  const path = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ [ARTIST_QUERY]: id }, "", path);
  } else {
    window.history.replaceState({ [ARTIST_QUERY]: id }, "", path);
  }
}
