import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useArtistList } from "../hooks/useArtistList";
const stubConfig = {
  artists: [
    { id: "lausbub", name: "LAUSBUB", spotify_artist_id: "abc" },
    { id: "king-gnu", name: "King Gnu", spotify_artist_id: "def" },
  ],
};

describe("useArtistList", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(stubConfig),
        })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("初期状態はloading", () => {
    const { result } = renderHook(() => useArtistList());
    expect(result.current.loading).toBe(true);
    expect(result.current.artists).toEqual([]);
  });

  it("取得成功時にartistsがセットされる", async () => {
    const { result } = renderHook(() => useArtistList());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.artists).toHaveLength(2);
    expect(result.current.artists[0].name).toBe("LAUSBUB");
    expect(result.current.error).toBeNull();
  });

  it("fetch失敗時にerrorがセットされる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 404 }))
    );

    const { result } = renderHook(() => useArtistList());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.artists).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });
});
