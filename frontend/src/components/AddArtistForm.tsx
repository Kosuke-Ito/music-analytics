import { useState, useCallback } from "react";

interface AddArtistFormProps {
  onClose: () => void;
}

interface SpotifyInfo {
  id: string;
  name: string;
  followers: number;
  genres: string[];
  popularity: number;
  image?: string;
}

interface YouTubeInfo {
  id: string;
  title: string;
  subscribers: number;
  thumbnail?: string;
}

function extractSpotifyId(url: string): string | null {
  const match = url.match(/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function extractYouTubeChannelId(url: string): string | null {
  const match = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function AddArtistForm({ onClose }: AddArtistFormProps) {
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [region, setRegion] = useState<"jp" | "global">("jp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [spotifyInfo, setSpotifyInfo] = useState<SpotifyInfo | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

  const [youtubeInfo, setYoutubeInfo] = useState<YouTubeInfo | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  const verifySpotify = useCallback(async (url: string) => {
    const id = extractSpotifyId(url);
    if (!id) { setSpotifyInfo(null); setSpotifyError(null); return; }

    setSpotifyLoading(true);
    setSpotifyError(null);
    try {
      const resp = await fetch(`/api/spotify-verify?id=${id}`);
      if (!resp.ok) {
        setSpotifyError("アーティストが見つかりません");
        setSpotifyInfo(null);
        return;
      }
      setSpotifyInfo(await resp.json());
    } catch {
      setSpotifyError("検証に失敗しました");
      setSpotifyInfo(null);
    } finally {
      setSpotifyLoading(false);
    }
  }, []);

  const verifyYouTube = useCallback(async (url: string) => {
    const id = extractYouTubeChannelId(url);
    if (!id) { setYoutubeInfo(null); setYoutubeError(null); return; }

    setYoutubeLoading(true);
    setYoutubeError(null);
    try {
      const resp = await fetch(`/api/youtube-verify?id=${id}`);
      if (!resp.ok) {
        setYoutubeError("チャンネルが見つかりません");
        setYoutubeInfo(null);
        return;
      }
      setYoutubeInfo(await resp.json());
    } catch {
      setYoutubeError("検証に失敗しました");
      setYoutubeInfo(null);
    } finally {
      setYoutubeLoading(false);
    }
  }, []);

  const handleSpotifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSpotifyUrl(url);
    if (url.includes("spotify.com/artist/")) verifySpotify(url);
    else { setSpotifyInfo(null); setSpotifyError(null); }
  };

  const handleYouTubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    if (url.includes("youtube.com/channel/")) verifyYouTube(url);
    else { setYoutubeInfo(null); setYoutubeError(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyInfo) {
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
          name: spotifyInfo.name,
          spotify_url: spotifyUrl,
          youtube_url: youtubeUrl || undefined,
          region,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Failed"); return; }
      setSuccess(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="add-artist-overlay" onClick={onClose}>
        <div className="add-artist-form" onClick={(e) => e.stopPropagation()}>
          <div className="add-artist-header">
            <h2>追加完了</h2>
            <button className="add-artist-close" onClick={onClose}>×</button>
          </div>
          <div className="form-success">
            <p><strong>{spotifyInfo?.name}</strong> を追加しました。</p>
            <p className="form-hint">次回のcronから収集が開始されます。</p>
          </div>
        </div>
      </div>
    );
  }

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
              onChange={handleSpotifyChange}
              placeholder="https://open.spotify.com/artist/..."
              required
            />
            {spotifyLoading && <div className="form-hint">検索中...</div>}
            {spotifyError && <div className="form-hint form-hint--error">{spotifyError}</div>}
          </div>

          {spotifyInfo && (
            <div className="form-preview">
              {spotifyInfo.image && <img src={spotifyInfo.image} alt="" className="form-preview-img" />}
              <div className="form-preview-body">
                <div className="form-preview-name">{spotifyInfo.name}</div>
                <div className="form-preview-meta">
                  {spotifyInfo.followers.toLocaleString("en-US")} followers
                  {spotifyInfo.genres.length > 0 && ` · ${spotifyInfo.genres.slice(0, 3).join(", ")}`}
                </div>
                <div className="form-preview-meta">Popularity: {spotifyInfo.popularity}/100</div>
              </div>
            </div>
          )}

          <div className="form-field">
            <label>YouTube Channel URL (optional)</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={handleYouTubeChange}
              placeholder="https://www.youtube.com/channel/UC..."
            />
            {youtubeLoading && <div className="form-hint">検索中...</div>}
            {youtubeError && <div className="form-hint form-hint--error">{youtubeError}</div>}
          </div>

          {youtubeInfo && (
            <div className="form-preview">
              {youtubeInfo.thumbnail && <img src={youtubeInfo.thumbnail} alt="" className="form-preview-img" />}
              <div className="form-preview-body">
                <div className="form-preview-name">{youtubeInfo.title}</div>
                <div className="form-preview-meta">
                  {youtubeInfo.subscribers.toLocaleString("en-US")} subscribers
                </div>
              </div>
            </div>
          )}

          <div className="form-field">
            <label>Region</label>
            <div className="form-radio-group">
              <label className="form-radio">
                <input type="radio" checked={region === "jp"} onChange={() => setRegion("jp")} />
                Japan
              </label>
              <label className="form-radio">
                <input type="radio" checked={region === "global"} onChange={() => setRegion("global")} />
                Global
              </label>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="form-submit" disabled={loading || !spotifyInfo}>
            {loading ? "追加中..." : "Add Artist"}
          </button>
        </form>
      </div>
    </div>
  );
}
