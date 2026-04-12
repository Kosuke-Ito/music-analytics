import type { CityListeners, ArtistData } from "../types";

export interface SimilarArtistResult {
  artistId: string;
  artistName: string;
  similarity: number;
  sharedCountries: string[];
}

/**
 * top_cities から国別リスナー数のベクトルを構築する。
 */
export function buildCountryVector(
  cities: CityListeners[],
): Record<string, number> {
  const vec: Record<string, number> = {};
  for (const c of cities) {
    vec[c.country] = (vec[c.country] ?? 0) + c.listeners;
  }
  return vec;
}

/**
 * 2つの国別ベクトルのコサイン類似度を計算する。
 * 1.0 = 完全一致、0.0 = 全く重ならない。
 */
export function cosineSimilarity(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  if (keys.size === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key of keys) {
    const va = a[key] ?? 0;
    const vb = b[key] ?? 0;
    dotProduct += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * 指定アーティストと最も似ているアーティストを返す。
 * top_cities の国別分布をベースにコサイン類似度で算出。
 */
export function findSimilarArtists(
  targetId: string,
  dataById: Record<string, ArtistData>,
  limit: number = 5,
): SimilarArtistResult[] {
  const targetData = dataById[targetId];
  if (!targetData?.records.length) return [];

  const targetCities = targetData.records[targetData.records.length - 1]?.top_cities;
  if (!targetCities?.length) return [];

  const targetVec = buildCountryVector(targetCities);
  const targetCountries = new Set(Object.keys(targetVec));

  const results: SimilarArtistResult[] = [];

  for (const [id, data] of Object.entries(dataById)) {
    if (id === targetId) continue;
    if (!data?.records.length) continue;

    const cities = data.records[data.records.length - 1]?.top_cities;
    if (!cities?.length) continue;

    const vec = buildCountryVector(cities);
    const similarity = cosineSimilarity(targetVec, vec);

    const sharedCountries = Object.keys(vec).filter((c) => targetCountries.has(c));

    results.push({
      artistId: id,
      artistName: data.artist_name,
      similarity,
      sharedCountries,
    });
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}
