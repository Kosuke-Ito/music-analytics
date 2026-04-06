import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAggregatedArtistData } from "../hooks/useAggregatedArtistData";
import type { ArtistData } from "../types";

const stubA: ArtistData = {
  artist_id: "a",
  artist_name: "A",
  records: [{ date: "2026-01-01", monthly_listeners: 100, collected_at: "2026-01-01T00:00:00+00:00" }],
};

describe("useAggregatedArtistData", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.endsWith("/king-gnu.json")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(stubA),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enabled=false のときはロードしない", () => {
    const { result } = renderHook(() => useAggregatedArtistData(["king-gnu"], false));
    expect(result.current.loading).toBe(false);
    expect(result.current.dataById).toEqual({});
  });

  it("まとめて取得して dataById を埋める", async () => {
    const { result } = renderHook(() => useAggregatedArtistData(["king-gnu"], true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dataById["king-gnu"]).toEqual(stubA);
    expect(result.current.error).toBeNull();
  });
});
