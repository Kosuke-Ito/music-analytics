import { useState } from "react";
import { useArtistData } from "../hooks/useArtistData";
import type { ArtistConfig } from "../types";

type SortKey = "name" | "spotify" | "youtube";
type SortDir = "asc" | "desc";

interface ArtistTableProps {
  artists: ArtistConfig[];
  onSelect: (artistId: string) => void;
  selectedId?: string | null;
}

function ArtistRow({
  artist,
  onSelect,
  onDataLoaded,
  isSelected,
}: {
  artist: ArtistConfig;
  onSelect: (id: string) => void;
  onDataLoaded: (id: string, spotify: number, youtube: number | null) => void;
  isSelected: boolean;
}) {
  const { data } = useArtistData(artist.id);
  const latest = data?.records[data.records.length - 1];

  if (data && latest) {
    onDataLoaded(artist.id, latest.monthly_listeners, latest.youtube_subscribers ?? null);
  }

  return (
    <tr className={`table-row ${isSelected ? "table-row--selected" : ""}`} onClick={() => onSelect(artist.id)}>
      <td className="table-cell table-cell-name">
        <span className="table-artist-name">{artist.name}</span>
        {artist.region && (
          <span className="table-region-badge">{artist.region === "jp" ? "JP" : "GL"}</span>
        )}
      </td>
      <td className="table-cell table-cell-number">
        {latest ? latest.monthly_listeners.toLocaleString("en-US") : "—"}
      </td>
      <td className="table-cell table-cell-number">
        {latest?.youtube_subscribers != null
          ? latest.youtube_subscribers.toLocaleString("en-US")
          : "—"}
      </td>
      <td className="table-cell table-cell-arrow">→</td>
    </tr>
  );
}

export function ArtistTable({ artists, onSelect, selectedId }: ArtistTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [artistData, setArtistData] = useState<
    Record<string, { spotify: number; youtube: number | null }>
  >({});

  const handleDataLoaded = (id: string, spotify: number, youtube: number | null) => {
    setArtistData((prev) => {
      if (prev[id]?.spotify === spotify && prev[id]?.youtube === youtube) return prev;
      return { ...prev, [id]: { spotify, youtube } };
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sorted = [...artists].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") {
      return a.name.localeCompare(b.name) * dir;
    }
    const aVal =
      sortKey === "spotify"
        ? (artistData[a.id]?.spotify ?? 0)
        : (artistData[a.id]?.youtube ?? 0);
    const bVal =
      sortKey === "spotify"
        ? (artistData[b.id]?.spotify ?? 0)
        : (artistData[b.id]?.youtube ?? 0);
    return (aVal - bVal) * dir;
  });

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="table-wrapper fade-in">
      <table className="artist-table">
        <thead>
          <tr>
            <th className="table-header table-header-name" onClick={() => handleSort("name")}>
              Artist{sortIndicator("name")}
            </th>
            <th className="table-header table-header-number" onClick={() => handleSort("spotify")}>
              Spotify{sortIndicator("spotify")}
            </th>
            <th className="table-header table-header-number" onClick={() => handleSort("youtube")}>
              YouTube{sortIndicator("youtube")}
            </th>
            <th className="table-header table-header-arrow" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((artist) => (
            <ArtistRow
              key={artist.id}
              artist={artist}
              onSelect={onSelect}
              onDataLoaded={handleDataLoaded}
              isSelected={artist.id === selectedId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
