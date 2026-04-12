import { describe, it, expect } from "vitest";
import {
  buildCountryVector,
  cosineSimilarity,
  findSimilarArtists,
} from "../utils/similarity";
import type { CityListeners, ArtistData } from "../types";

describe("buildCountryVector", () => {
  it("aggregates by country", () => {
    const cities: CityListeners[] = [
      { city: "Osaka", country: "JP", listeners: 300 },
      { city: "Tokyo", country: "JP", listeners: 200 },
      { city: "Taipei", country: "TW", listeners: 100 },
    ];
    const vec = buildCountryVector(cities);
    expect(vec).toEqual({ JP: 500, TW: 100 });
  });

  it("returns empty for empty input", () => {
    expect(buildCountryVector([])).toEqual({});
  });
});

describe("cosineSimilarity", () => {
  it("identical vectors return 1", () => {
    const a = { JP: 500, TW: 100 };
    expect(cosineSimilarity(a, a)).toBeCloseTo(1.0, 5);
  });

  it("orthogonal vectors return 0", () => {
    const a = { JP: 500 };
    const b = { US: 300 };
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("empty vectors return 0", () => {
    expect(cosineSimilarity({}, {})).toBe(0);
  });
});

describe("findSimilarArtists", () => {
  const dataById: Record<string, ArtistData> = {
    "king-gnu": {
      artist_id: "s1",
      artist_name: "King Gnu",
      records: [{
        date: "2026-04-12",
        monthly_listeners: 1_000_000,
        collected_at: "2026-04-12T00:00:00Z",
        top_cities: [
          { city: "Osaka", country: "JP", listeners: 300 },
          { city: "Tokyo", country: "JP", listeners: 200 },
          { city: "Taipei", country: "TW", listeners: 100 },
        ],
      }],
      metadata: {
        ytm_related_artists: [
          { name: "YOASOBI", browse_id: "UC1", subscribers: "7M" },
          { name: "Vaundy", browse_id: "UC2", subscribers: "3M" },
          { name: "Unknown Artist", browse_id: "UC99", subscribers: "1K" },
        ],
        lastfm_similar_artists: [
          { name: "RADWIMPS", url: "https://last.fm/music/RADWIMPS" },
        ],
      },
    },
    yoasobi: {
      artist_id: "s2",
      artist_name: "YOASOBI",
      records: [{
        date: "2026-04-12",
        monthly_listeners: 2_000_000,
        collected_at: "2026-04-12T00:00:00Z",
        top_cities: [
          { city: "Osaka", country: "JP", listeners: 200 },
          { city: "Taipei", country: "TW", listeners: 150 },
        ],
      }],
    },
    vaundy: {
      artist_id: "s3",
      artist_name: "Vaundy",
      records: [{
        date: "2026-04-12",
        monthly_listeners: 500_000,
        collected_at: "2026-04-12T00:00:00Z",
        top_cities: [
          { city: "Osaka", country: "JP", listeners: 100 },
        ],
      }],
    },
    radwimps: {
      artist_id: "s4",
      artist_name: "RADWIMPS",
      records: [{
        date: "2026-04-12",
        monthly_listeners: 800_000,
        collected_at: "2026-04-12T00:00:00Z",
        top_cities: [
          { city: "Tokyo", country: "JP", listeners: 300 },
        ],
      }],
    },
    blackpink: {
      artist_id: "s5",
      artist_name: "BLACKPINK",
      records: [{
        date: "2026-04-12",
        monthly_listeners: 5_000_000,
        collected_at: "2026-04-12T00:00:00Z",
        top_cities: [
          { city: "Jakarta", country: "ID", listeners: 500 },
          { city: "Mexico City", country: "MX", listeners: 400 },
        ],
      }],
    },
  };

  it("YouTube Music related_artists のマッチが最優先", () => {
    const result = findSimilarArtists("king-gnu", dataById);
    // ytm_related_artists に YOASOBI と Vaundy がある
    expect(result[0].artistId).toBe("yoasobi");
    expect(result[0].source).toBe("ytm");
    expect(result[0].similarity).toBeGreaterThan(0.9);
  });

  it("YouTube Music の2番目も含まれる", () => {
    const result = findSimilarArtists("king-gnu", dataById);
    const vaundy = result.find((r) => r.artistId === "vaundy");
    expect(vaundy).toBeDefined();
    expect(vaundy!.source).toBe("ytm");
  });

  it("Last.fm similar_artists もマッチする", () => {
    const result = findSimilarArtists("king-gnu", dataById);
    const radwimps = result.find((r) => r.artistId === "radwimps");
    expect(radwimps).toBeDefined();
    expect(radwimps!.source).toBe("lastfm");
  });

  it("related にも similar にも無いアーティストは cities で補完", () => {
    const result = findSimilarArtists("king-gnu", dataById);
    const bp = result.find((r) => r.artistId === "blackpink");
    // BLACKPINK は related/similar に無い → cities ベース or 含まれない
    if (bp) {
      expect(bp.source).toBe("cities");
      expect(bp.similarity).toBeLessThan(0.5);
    }
  });

  it("自分自身は含まない", () => {
    const result = findSimilarArtists("king-gnu", dataById);
    expect(result.find((r) => r.artistId === "king-gnu")).toBeUndefined();
  });

  it("トラッキングしていないアーティストは除外", () => {
    // "Unknown Artist" は ytm_related にあるが dataById にない
    const result = findSimilarArtists("king-gnu", dataById);
    expect(result.find((r) => r.artistName === "Unknown Artist")).toBeUndefined();
  });

  it("metadata が無い場合は cities のみで計算", () => {
    const noMetaData: Record<string, ArtistData> = {
      a: {
        artist_id: "a",
        artist_name: "A",
        records: [{
          date: "2026-04-12",
          monthly_listeners: 100,
          collected_at: "",
          top_cities: [{ city: "Tokyo", country: "JP", listeners: 100 }],
        }],
      },
      b: {
        artist_id: "b",
        artist_name: "B",
        records: [{
          date: "2026-04-12",
          monthly_listeners: 200,
          collected_at: "",
          top_cities: [{ city: "NYC", country: "US", listeners: 200 }],
        }],
      },
    };
    const result = findSimilarArtists("a", noMetaData);
    // JP vs US で類似度低い → 結果なし or cities ソース
    expect(result.length).toBeLessThanOrEqual(1);
  });
});
