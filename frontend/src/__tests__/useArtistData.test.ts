import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useArtistData } from "../hooks/useArtistData";
import type { ArtistData } from "../types";

const stubData: ArtistData = {
  artist_id: "1nK2FcujOkjFDDAr1EMo2M",
  artist_name: "LAUSBUB",
  records: [
    {
      date: "2026-03-30",
      monthly_listeners: 30000,
      collected_at: "2026-03-30T00:05:00+00:00",
    },
    {
      date: "2026-03-31",
      monthly_listeners: 28970,
      collected_at: "2026-03-31T00:05:00+00:00",
    },
  ],
};

describe("useArtistData", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(stubData),
        })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("初期状態はloading", () => {
    const { result } = renderHook(() => useArtistData("lausbub"));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("データ取得成功時にdataがセットされる", async () => {
    const { result } = renderHook(() => useArtistData("lausbub"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(stubData);
    expect(result.current.error).toBeNull();
  });

  it("fetch失敗時にerrorがセットされる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      )
    );

    const { result } = renderHook(() => useArtistData("lausbub"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
  });
});
