import type { ArtistConfig, ArtistData } from "../types";

interface ArtistGridProps {
  artists: ArtistConfig[];
  dataById: Record<string, ArtistData>;
  onSelect: (artistId: string) => void;
  selectedId?: string | null;
}

function ArtistCard({
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
  const hasDataWarning = latest?.validation_flags?.includes("large_monthly_listener_delta");

  return (
    <div
      className={`artist-card ${isSelected ? "artist-card--selected" : ""}`}
      onClick={() => onSelect(artist.id)}
    >
      <div className="artist-card-header">
        <span className="artist-card-name">{artist.name}</span>
        {hasDataWarning && (
          <span className="artist-card-warning" title="リスナー数の変動が大きい日があります（要確認）">
            ⚠
          </span>
        )}
      </div>
      <div className="artist-card-stats">
        <div className="artist-card-meta">
          <span className="artist-card-listeners">
            {latest ? latest.monthly_listeners.toLocaleString("en-US") : "—"}
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

export function ArtistGrid({ artists, dataById, onSelect, selectedId }: ArtistGridProps) {
  return (
    <div className="artist-grid">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          data={dataById[artist.id]}
          onSelect={onSelect}
          isSelected={artist.id === selectedId}
        />
      ))}
    </div>
  );
}
