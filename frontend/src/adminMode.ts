/**
 * 管理操作（Add Artist 等）の表示フラグ。
 * デモは全公開なので、URL に ?admin を付けたオーナーだけに管理UIを見せる。
 * 認証は /api/* 側の Basic 認証が担うため、これは「隠す」だけの仕組み。
 */
export function isAdminFromSearch(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return params.has("admin");
}
