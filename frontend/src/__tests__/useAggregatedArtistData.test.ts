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

  it("一部の取得失敗は error にせず、成功分だけ dataById に入れる", async () => {
    const { result } = renderHook(() =>
      useAggregatedArtistData(["king-gnu", "missing"], true)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dataById).toEqual({ "king-gnu": stubA });
    expect(result.current.error).toBeNull();
  });

  it("全アーティストの取得に失敗したら error を返す", async () => {
    const { result } = renderHook(() =>
      useAggregatedArtistData(["missing-1", "missing-2"], true)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dataById).toEqual({});
    expect(result.current.error).toBe("全アーティストのデータ取得に失敗しました");
  });

  it("enabled が false→true に変わったらロードが走る", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useAggregatedArtistData(["king-gnu"], enabled),
      { initialProps: { enabled: false } }
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.dataById).toEqual({});

    rerender({ enabled: true });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.dataById["king-gnu"]).toEqual(stubA);
  });

  it("artistIds が変わったら loading に戻る", async () => {
    const stubB: ArtistData = { ...stubA, artist_id: "b", artist_name: "B" };
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.endsWith("/king-gnu.json")) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(stubA) });
        }
        if (url.endsWith("/vaundy.json")) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(stubB) });
        }
        return Promise.resolve({ ok: false, status: 404 });
      })
    );

    const { result, rerender } = renderHook(
      ({ ids }) => useAggregatedArtistData(ids, true),
      { initialProps: { ids: ["king-gnu"] } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ ids: ["king-gnu", "vaundy"] });

    // キーが変わった直後は loading に戻る
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.dataById["vaundy"]).toEqual(stubB);
  });
});
