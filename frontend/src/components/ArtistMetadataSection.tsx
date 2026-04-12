import type { ArtistMetadata } from "../types";

interface ArtistMetadataSectionProps {
  metadata?: ArtistMetadata;
}

export function ArtistMetadataSection({ metadata }: ArtistMetadataSectionProps) {
  if (!metadata) return null;

  const {
    ytm_related_artists,
    lastfm_similar_artists,
    lastfm_tags,
    ytm_top_songs,
    ytm_description,
  } = metadata;

  const hasContent =
    ytm_related_artists?.length ||
    lastfm_similar_artists?.length ||
    lastfm_tags?.length ||
    ytm_top_songs?.length;

  if (!hasContent) return null;

  return (
    <div className="metadata-section">
      {/* Tags */}
      {lastfm_tags && lastfm_tags.length > 0 && (
        <div className="metadata-group">
          <span className="chart-section-title">ジャンル / タグ</span>
          <div className="metadata-tags">
            {lastfm_tags.map((tag) => (
              <span key={tag} className="metadata-tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* YouTube Music Related Artists */}
      {ytm_related_artists && ytm_related_artists.length > 0 && (
        <div className="metadata-group">
          <span className="chart-section-title">
            YouTube Music 関連アーティスト
            <span className="section-help" title="YouTube Music が公式に推薦する関連アーティスト。ファン層の重なりを示す重要なシグナルです。"> ⓘ</span>
          </span>
          <div className="metadata-list">
            {ytm_related_artists.slice(0, 8).map((artist) => (
              <div key={artist.browse_id || artist.name} className="metadata-artist-item">
                <span className="metadata-artist-name">{artist.name}</span>
                {artist.subscribers && (
                  <span className="metadata-artist-subs">{artist.subscribers}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last.fm Similar Artists */}
      {lastfm_similar_artists && lastfm_similar_artists.length > 0 && (
        <div className="metadata-group">
          <span className="chart-section-title">Last.fm 類似アーティスト</span>
          <div className="metadata-list">
            {lastfm_similar_artists.slice(0, 8).map((artist) => (
              <div key={artist.name} className="metadata-artist-item">
                <span className="metadata-artist-name">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YouTube Music Top Songs */}
      {ytm_top_songs && ytm_top_songs.length > 0 && (
        <div className="metadata-group">
          <span className="chart-section-title">YouTube Music トップ曲</span>
          <div className="metadata-songs">
            {ytm_top_songs.slice(0, 5).map((song, i) => (
              <div key={song.video_id || song.title} className="metadata-song-item">
                <span className="metadata-song-rank">{i + 1}</span>
                <span className="metadata-song-title">{song.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {ytm_description && (
        <div className="metadata-group">
          <span className="chart-section-title">About</span>
          <p className="metadata-description">{ytm_description}</p>
        </div>
      )}
    </div>
  );
}
