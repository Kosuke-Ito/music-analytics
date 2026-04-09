import { useMemo, useState } from "react";
import type { ArtistConfig, ArtistData } from "../types";

type SortKey = "name" | "spotify" | "youtube" | "lastfm";
type SortDir = "asc" | "desc";

interface ArtistTableProps {
  artists: ArtistConfig[];
  dataById: Record<string, ArtistData>;
  onSelect: (artistId: string) => void;
  selectedId?: string | null;
}

function ArtistRow({
  artist,
  data,
  onSelect,
  isSelected,
}: {
  artist: ArtistConfig;
  data?: ArtistData;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  const latest = data?.records[data.records.length - 1];

  return (
    <tr
      className={`table-row ${isSelected ? "table-row--selected" : ""}`}
      onClick={() => onSelect(artist.id)}
    >
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
      <td className="table-cell table-cell-number">
        {latest?.lastfm_listeners != null
          ? latest.lastfm_listeners.toLocaleString("en-US")
          : "—"}
      </td>
      <td className="table-cell table-cell-arrow">→</td>
    </tr>
  );
}

export function ArtistTable({ artists, dataById, onSelect, selectedId }: ArtistTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const metrics = useMemo(() => {
    const m: Record<string, { spotify: number; youtube: number | null; lastfm: number | null }> = {};
    for (const a of artists) {
      const latest = dataById[a.id]?.records.at(-1);
      m[a.id] = {
        spotify: latest?.monthly_listeners ?? 0,
        youtube: latest?.youtube_subscribers ?? null,
        lastfm: latest?.lastfm_listeners ?? null,
      };
    }
    return m;
  }, [artists, dataById]);

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
    const getVal = (id: string) => {
      if (sortKey === "spotify") return metrics[id]?.spotify ?? 0;
      if (sortKey === "youtube") return metrics[id]?.youtube ?? 0;
      return metrics[id]?.lastfm ?? 0;
    };
    const aVal = getVal(a.id);
    const bVal = getVal(b.id);
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
            <th className="table-header table-header-number" onClick={() => handleSort("lastfm")}>
              Last.fm{sortIndicator("lastfm")}
            </th>
            <th className="table-header table-header-arrow" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((artist) => (
            <ArtistRow
              key={artist.id}
              artist={artist}
              data={dataById[artist.id]}
              onSelect={onSelect}
              isSelected={artist.id === selectedId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
