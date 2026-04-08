import { useState } from "react";

interface AddArtistFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddArtistForm({ onClose, onSuccess }: AddArtistFormProps) {
  const [name, setName] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [region, setRegion] = useState<"jp" | "global">("jp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      onSuccess();
    } catch (err) {
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
          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? "Adding..." : "Add Artist"}
          </button>
        </form>
      </div>
    </div>
  );
}
