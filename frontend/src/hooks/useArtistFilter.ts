import { useState, useMemo } from "react";
import type { ArtistConfig } from "../types";

export function useArtistFilter(artists: ArtistConfig[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const labels = useMemo(() => {
    const set = new Set<string>();
    for (const a of artists) if (a.label) set.add(a.label);
    return [...set].sort();
  }, [artists]);

  const filteredArtists = useMemo(() => {
    let result = artists;
    if (selectedLabel) {
      result = result.filter((a) => a.label === selectedLabel);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().startsWith(q) || a.id.startsWith(q));
    }
    return result;
  }, [artists, selectedLabel, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, ArtistConfig[]> = {};
    for (const artist of filteredArtists) {
      const region = artist.region ?? "global";
      if (!groups[region]) groups[region] = [];
      groups[region].push(artist);
    }
    return groups;
  }, [filteredArtists]);

  return {
    searchQuery,
    setSearchQuery,
    selectedLabel,
    setSelectedLabel,
    labels,
    filteredArtists,
    grouped,
  };
}
