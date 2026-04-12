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

  it("similar vectors return high value", () => {
    const a = { JP: 500, TW: 100 };
    const b = { JP: 400, TW: 80, KR: 20 };
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThan(0.9);
  });

  it("different vectors return low value", () => {
    const a = { JP: 500, TW: 100 };
    const b = { ID: 400, MX: 300, MY: 200 };
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeLessThan(0.1);
  });

  it("empty vectors return 0", () => {
    expect(cosineSimilarity({}, {})).toBe(0);
    expect(cosineSimilarity({ JP: 100 }, {})).toBe(0);
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
          { city: "Jakarta", country: "ID", listeners: 100 },
        ],
      }],
    },
    blackpink: {
      artist_id: "s3",
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

  it("King Gnu に最も似ているのは YOASOBI（日本中心）", () => {
    const result = findSimilarArtists("king-gnu", dataById);
    expect(result[0].artistId).toBe("yoasobi");
    expect(result[0].similarity).toBeGreaterThan(0.5);
  });

  it("King Gnu と BLACKPINK は似ていない", () => {
    const result = findSimilarArtists("king-gnu", dataById);
    const bp = result.find((r) => r.artistId === "blackpink");
    expect(bp?.similarity).toBeLessThan(0.3);
  });

  it("自分自身は含まない", () => {
    const result = findSimilarArtists("king-gnu", dataById);
    expect(result.find((r) => r.artistId === "king-gnu")).toBeUndefined();
  });

  it("top_cities が無いアーティストは除外される", () => {
    const partialData = {
      ...dataById,
      "no-cities": {
        artist_id: "s4",
        artist_name: "No Cities",
        records: [{ date: "2026-04-12", monthly_listeners: 100, collected_at: "" }],
      },
    };
    const result = findSimilarArtists("king-gnu", partialData);
    expect(result.find((r) => r.artistId === "no-cities")).toBeUndefined();
  });
});
