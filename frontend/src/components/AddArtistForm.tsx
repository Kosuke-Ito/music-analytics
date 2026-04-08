import { useState, useCallback } from "react";

interface AddArtistFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface SpotifyPreview {
  name: string;
  id: string;
  image?: string;
  followers?: number;
  monthlyListeners?: number;
}

function extractSpotifyId(url: string): string | null {
  const match = url.match(/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function AddArtistForm({ onClose, onSuccess }: AddArtistFormProps) {
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [region, setRegion] = useState<"jp" | "global">("jp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<SpotifyPreview | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const lookupArtist = useCallback(async (url: string) => {
    const id = extractSpotifyId(url);
    if (!id) {
      setPreview(null);
      setLookupError(null);
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const resp = await fetch(`/api/spotify-lookup?id=${id}`);
      if (!resp.ok) {
        setLookupError("アーティストが見つかりません");
        setPreview(null);
        return;
      }
      const data = await resp.json();
      setPreview(data);
    } catch {
      setLookupError("検索に失敗しました");
      setPreview(null);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const handleSpotifyUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSpotifyUrl(url);
    if (url.includes("spotify.com/artist/")) {
      lookupArtist(url);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) {
      setError("Spotify URLを入力してアーティストを確認してください");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/add-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preview.name,
          spotify_url: spotifyUrl,
          youtube_url: youtubeUrl || undefined,
          region,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Failed to add artist");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-artist-overlay" onClick={onClose}>
      <div className="add-artist-form" onClick={(e) => e.stopPropagation()}>
        <div className="add-artist-header">
          <h2>Add Artist</h2>
          <button className="add-artist-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Spotify URL</label>
            <input
              type="url"
              value={spotifyUrl}
              onChange={handleSpotifyUrlChange}
              placeholder="https://open.spotify.com/artist/..."
              required
            />
            {lookupLoading && <div className="form-hint">検索中...</div>}
            {lookupError && <div className="form-hint form-hint--error">{lookupError}</div>}
          </div>

          {preview && (
            <div className="form-preview">
              <div className="form-preview-name">{preview.name}</div>
              {preview.followers != null && (
                <div className="form-preview-meta">
                  {preview.followers.toLocaleString("en-US")} followers
                </div>
              )}
              <div className="form-preview-check">このアーティストで合っていますか？</div>
            </div>
          )}

          <div className="form-field">
            <label>YouTube Channel URL (optional)</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/channel/UC..."
            />
          </div>
          <div className="form-field">
            <label>Region</label>
            <div className="form-radio-group">
              <label className="form-radio">
                <input
                  type="radio"
                  checked={region === "jp"}
                  onChange={() => setRegion("jp")}
                />
                Japan
              </label>
              <label className="form-radio">
                <input
                  type="radio"
                  checked={region === "global"}
                  onChange={() => setRegion("global")}
                />
                Global
              </label>
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="form-submit" disabled={loading || !preview}>
            {loading ? "Adding..." : "Add Artist"}
          </button>
        </form>
      </div>
    </div>
  );
}
