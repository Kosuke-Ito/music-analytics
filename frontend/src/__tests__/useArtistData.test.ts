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

  it("artistId切り替え時はloadingに戻り、前のアーティストのデータを返さない", async () => {
    const otherData: ArtistData = { ...stubData, artist_id: "other", artist_name: "OTHER" };
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(url.endsWith("/other.json") ? otherData : stubData),
        })
      )
    );

    const { result, rerender } = renderHook(
      ({ id }) => useArtistData(id),
      { initialProps: { id: "lausbub" } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual(stubData);

    rerender({ id: "other" });

    // 切り替え直後: loadingに戻り、旧アーティストのデータは見えない
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual(otherData);
  });

  it("遅れて届いた前アーティストのレスポンスが現在の表示を上書きしない", async () => {
    const otherData: ArtistData = { ...stubData, artist_id: "other", artist_name: "OTHER" };
    // lausbub のレスポンスは手動で解決できるようにしておく
    let resolveSlow!: (value: unknown) => void;
    const slowPromise = new Promise((resolve) => {
      resolveSlow = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.endsWith("/other.json")
          ? Promise.resolve({ ok: true, json: () => Promise.resolve(otherData) })
          : slowPromise
      )
    );

    const { result, rerender } = renderHook(
      ({ id }) => useArtistData(id),
      { initialProps: { id: "lausbub" } }
    );

    // lausbub のレスポンスが届く前に other へ切り替える
    rerender({ id: "other" });
    await waitFor(() => {
      expect(result.current.data).toEqual(otherData);
    });

    // 遅れて lausbub のレスポンスが届いても other の表示を上書きしない
    resolveSlow({ ok: true, json: () => Promise.resolve(stubData) });
    await Promise.resolve();
    expect(result.current.data).toEqual(otherData);
    expect(result.current.loading).toBe(false);
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
