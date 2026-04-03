import { useArtistData } from "../hooks/useArtistData";
import type { ArtistConfig } from "../types";

interface ArtistGridProps {
  artists: ArtistConfig[];
  onSelect: (artistId: string) => void;
  selectedId?: string | null;
}

function ArtistCard({
  artist,
  onSelect,
  isSelected,
}: {
  artist: ArtistConfig;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  const { data } = useArtistData(artist.id);
  const latest = data?.records[data.records.length - 1];

  return (
    <div
      className={`artist-card ${isSelected ? "artist-card--selected" : ""}`}
      onClick={() => onSelect(artist.id)}
    >
      <span className="artist-card-name">{artist.name}</span>
      <div className="artist-card-stats">
        <div className="artist-card-meta">
          <span className="artist-card-listeners">
            {latest
              ? latest.monthly_listeners.toLocaleString("en-US")
              : "—"}
          </span>
          <span className="artist-card-label">Spotify Listeners</span>
        </div>
        {latest?.youtube_subscribers != null && (
          <div className="artist-card-meta">
            <span className="artist-card-subscribers">
              {latest.youtube_subscribers.toLocaleString("en-US")}
            </span>
            <span className="artist-card-label">YouTube Subscribers</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ArtistGrid({ artists, onSelect, selectedId }: ArtistGridProps) {
  return (
    <div className="artist-grid">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          onSelect={onSelect}
          isSelected={artist.id === selectedId}
        />
      ))}
    </div>
  );
}
