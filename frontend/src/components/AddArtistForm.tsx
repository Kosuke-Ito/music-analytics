import { useState } from "react";

interface AddArtistFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function extractSpotifyId(url: string): string | null {
  const match = url.match(/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function AddArtistForm({ onClose, onSuccess }: AddArtistFormProps) {
  const [name, setName] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [region, setRegion] = useState<"jp" | "global">("jp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const spotifyId = extractSpotifyId(spotifyUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyId) {
      setError("有効なSpotify URLを入力してください");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/add-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
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

      setPrUrl(data.pr_url);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (prUrl) {
    return (
      <div className="add-artist-overlay" onClick={onClose}>
        <div className="add-artist-form" onClick={(e) => e.stopPropagation()}>
          <div className="add-artist-header">
            <h2>PR Created</h2>
            <button className="add-artist-close" onClick={onClose}>×</button>
          </div>
          <div className="form-success">
            <p><strong>{name}</strong> の追加PRを作成しました。</p>
            <a href={prUrl} target="_blank" rel="noopener noreferrer" className="form-pr-link">
              GitHubでPRを確認 →
            </a>
            <p className="form-hint">マージすると次回のcronから収集が開始されます。</p>
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
            <label>Artist Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="King Gnu"
              required
            />
          </div>
          <div className="form-field">
            <label>Spotify URL</label>
            <input
              type="url"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              required
            />
            {spotifyUrl && !spotifyId && (
              <div className="form-hint form-hint--error">有効なSpotify URLではありません</div>
            )}
            {spotifyId && (
              <div className="form-hint">ID: {spotifyId}</div>
            )}
          </div>
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
          <button type="submit" className="form-submit" disabled={loading || !spotifyId}>
            {loading ? "Creating PR..." : "Add Artist (PR)"}
          </button>
          <div className="form-hint" style={{ marginTop: 8, textAlign: "center" }}>
            送信するとGitHubにPRが作成されます（レビュー後にマージ）
          </div>
        </form>
      </div>
    </div>
  );
}
