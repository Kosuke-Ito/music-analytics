import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useArtistFilter } from "../hooks/useArtistFilter";
import type { ArtistConfig } from "../types";

const mockArtists: ArtistConfig[] = [
  { id: "yoasobi", name: "YOASOBI", spotify_artist_id: "s1", region: "jp", label: "Ariola Japan" },
  { id: "vaundy", name: "Vaundy", spotify_artist_id: "s2", region: "jp", label: "Echoes" },
  { id: "blackpink", name: "BLACKPINK", spotify_artist_id: "s3", region: "global" },
  { id: "radwimps", name: "RADWIMPS", spotify_artist_id: "s4", region: "jp", label: "Ariola Japan" },
];

describe("useArtistFilter", () => {
  it("returns all artists with no filter", () => {
    const { result } = renderHook(() => useArtistFilter(mockArtists));
    expect(result.current.filteredArtists).toHaveLength(4);
  });

  it("filters by label", () => {
    const { result } = renderHook(() => useArtistFilter(mockArtists));
    act(() => result.current.setSelectedLabel("Echoes"));
    expect(result.current.filteredArtists).toHaveLength(1);
    expect(result.current.filteredArtists[0].id).toBe("vaundy");
  });

  it("filters by search query (prefix match on name)", () => {
    const { result } = renderHook(() => useArtistFilter(mockArtists));
    act(() => result.current.setSearchQuery("yoa"));
    expect(result.current.filteredArtists).toHaveLength(1);
    expect(result.current.filteredArtists[0].id).toBe("yoasobi");
  });

  it("filters by search query (prefix match on id)", () => {
    const { result } = renderHook(() => useArtistFilter(mockArtists));
    act(() => result.current.setSearchQuery("rad"));
    expect(result.current.filteredArtists).toHaveLength(1);
  });

  it("combines label and search filters", () => {
    const { result } = renderHook(() => useArtistFilter(mockArtists));
    act(() => {
      result.current.setSelectedLabel("Ariola Japan");
      result.current.setSearchQuery("yoa");
    });
    expect(result.current.filteredArtists).toHaveLength(1);
    expect(result.current.filteredArtists[0].id).toBe("yoasobi");
  });

  it("groups by region", () => {
    const { result } = renderHook(() => useArtistFilter(mockArtists));
    expect(result.current.grouped["jp"]).toHaveLength(3);
    expect(result.current.grouped["global"]).toHaveLength(1);
  });

  it("extracts unique labels", () => {
    const { result } = renderHook(() => useArtistFilter(mockArtists));
    expect(result.current.labels).toEqual(["Ariola Japan", "Echoes"]);
  });

  it("clears label when set to null", () => {
    const { result } = renderHook(() => useArtistFilter(mockArtists));
    act(() => result.current.setSelectedLabel("Echoes"));
    expect(result.current.filteredArtists).toHaveLength(1);
    act(() => result.current.setSelectedLabel(null));
    expect(result.current.filteredArtists).toHaveLength(4);
  });
});
