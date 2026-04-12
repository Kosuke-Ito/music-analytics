import type { CityListeners, ArtistData } from "../types";

export interface SimilarArtistResult {
  artistId: string;
  artistName: string;
  similarity: number;
  source: "ytm" | "lastfm" | "cities";
}

/**
 * metadata の related/similar artists を主軸に、
 * トラッキング中のアーティストと照合して類似度を計算する。
 *
 * 優先順位:
 * 1. YouTube Music related_artists（公式推薦）
 * 2. Last.fm similar_artists（公式推薦）
 * 3. top_cities のコサイン類似度（補完）
 */
export function findSimilarArtists(
  targetId: string,
  dataById: Record<string, ArtistData>,
  limit: number = 5,
): SimilarArtistResult[] {
  const targetData = dataById[targetId];
  if (!targetData) return [];

  // トラッキング中のアーティスト名 → ID のマップ
  const nameToId = new Map<string, string>();
  for (const [id, data] of Object.entries(dataById)) {
    if (id === targetId) continue;
    nameToId.set(data.artist_name.toLowerCase(), id);
  }

  const scored = new Map<string, SimilarArtistResult>();

  // 1. YouTube Music related_artists（スコア: 0.9〜1.0, 順位による）
  const ytmRelated = targetData.metadata?.ytm_related_artists ?? [];
  for (let i = 0; i < ytmRelated.length; i++) {
    const name = ytmRelated[i].name.toLowerCase();
    const matchedId = nameToId.get(name);
    if (!matchedId) continue;

    const score = 1.0 - i * 0.05; // 1位=1.0, 2位=0.95, ...
    if (!scored.has(matchedId) || scored.get(matchedId)!.similarity < score) {
      scored.set(matchedId, {
        artistId: matchedId,
        artistName: dataById[matchedId].artist_name,
        similarity: Math.max(score, 0.5),
        source: "ytm",
      });
    }
  }

  // 2. Last.fm similar_artists（スコア: 0.7〜0.9, 順位による）
  const lfmSimilar = targetData.metadata?.lastfm_similar_artists ?? [];
  for (let i = 0; i < lfmSimilar.length; i++) {
    const name = lfmSimilar[i].name.toLowerCase();
    const matchedId = nameToId.get(name);
    if (!matchedId) continue;

    const score = 0.9 - i * 0.05;
    if (!scored.has(matchedId) || scored.get(matchedId)!.similarity < score) {
      scored.set(matchedId, {
        artistId: matchedId,
        artistName: dataById[matchedId].artist_name,
        similarity: Math.max(score, 0.4),
        source: "lastfm",
      });
    }
  }

  // 3. top_cities コサイン類似度（補完、scored に無いアーティストのみ）
  const targetCities = targetData.records[targetData.records.length - 1]?.top_cities;
  if (targetCities?.length && scored.size < limit) {
    const targetVec = buildCountryVector(targetCities);
    for (const [id, data] of Object.entries(dataById)) {
      if (id === targetId || scored.has(id)) continue;
      if (!data?.records.length) continue;

      const cities = data.records[data.records.length - 1]?.top_cities;
      if (!cities?.length) continue;

      const vec = buildCountryVector(cities);
      const sim = cosineSimilarity(targetVec, vec);
      if (sim > 0.3) {
        scored.set(id, {
          artistId: id,
          artistName: data.artist_name,
          similarity: sim * 0.7, // cities ベースは0.7掛けして related_artists より下に
          source: "cities",
        });
      }
    }
  }

  const results = [...scored.values()];
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}

// --- 以下は top_cities 補完用のヘルパー（既存テスト互換） ---

export function buildCountryVector(
  cities: CityListeners[],
): Record<string, number> {
  const vec: Record<string, number> = {};
  for (const c of cities) {
    vec[c.country] = (vec[c.country] ?? 0) + c.listeners;
  }
  return vec;
}

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
