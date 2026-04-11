import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUrlSync } from "../hooks/useUrlSync";
import type { ArtistConfig } from "../types";

const mockArtists: ArtistConfig[] = [
  { id: "yoasobi", name: "YOASOBI", spotify_artist_id: "s1" },
  { id: "vaundy", name: "Vaundy", spotify_artist_id: "s2" },
  { id: "blackpink", name: "BLACKPINK", spotify_artist_id: "s3" },
];

describe("useUrlSync", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("returns null while artists are empty", () => {
    const { result } = renderHook(() => useUrlSync([]));
    expect(result.current.selectedId).toBeNull();
  });

  it("selects the first artist when URL has no artist param", () => {
    const { result } = renderHook(() => useUrlSync(mockArtists));
    expect(result.current.selectedId).toBe("yoasobi");
    expect(window.location.search).toContain("artist=yoasobi");
  });

  it("selects the artist from URL parameter when valid", () => {
    window.history.replaceState({}, "", "/?artist=vaundy");
    const { result } = renderHook(() => useUrlSync(mockArtists));
    expect(result.current.selectedId).toBe("vaundy");
  });

  it("falls back to the first artist when URL parameter is invalid", () => {
    window.history.replaceState({}, "", "/?artist=unknown");
    const { result } = renderHook(() => useUrlSync(mockArtists));
    expect(result.current.selectedId).toBe("yoasobi");
  });

  it("selectArtist updates state and pushes to history", () => {
    const { result } = renderHook(() => useUrlSync(mockArtists));
    act(() => result.current.selectArtist("blackpink"));
    expect(result.current.selectedId).toBe("blackpink");
    expect(window.location.search).toContain("artist=blackpink");
  });

  it("responds to popstate event with valid id", () => {
    const { result } = renderHook(() => useUrlSync(mockArtists));
    expect(result.current.selectedId).toBe("yoasobi");

    act(() => {
      window.history.pushState({}, "", "/?artist=vaundy");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.selectedId).toBe("vaundy");
  });

  it("ignores popstate when id is not in artist list", () => {
    const { result } = renderHook(() => useUrlSync(mockArtists));
    act(() => {
      window.history.pushState({}, "", "/?artist=unknown");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.selectedId).toBe("yoasobi");
  });
});
