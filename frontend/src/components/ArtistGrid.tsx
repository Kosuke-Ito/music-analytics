import { useArtistData } from "../hooks/useArtistData";
import type { ArtistConfig } from "../types";

interface ArtistGridProps {
  artists: ArtistConfig[];
  onSelect: (artistId: string) => void;
}

function ArtistCard({
  artist,
  onSelect,
}: {
  artist: ArtistConfig;
  onSelect: (id: string) => void;
}) {
  const { data } = useArtistData(artist.id);
  const latest = data?.records[data.records.length - 1];

  return (
    <div className="artist-card" onClick={() => onSelect(artist.id)}>
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
      <span className="artist-card-arrow">→</span>
    </div>
  );
}

export function ArtistGrid({ artists, onSelect }: ArtistGridProps) {
  return (
    <div className="artist-grid fade-in">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} onSelect={onSelect} />
      ))}
    </div>
  );
}
