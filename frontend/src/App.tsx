import { useState, useMemo, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { ArtistGrid } from "./components/ArtistGrid";
import { ArtistTable } from "./components/ArtistTable";
import { useArtistList } from "./hooks/useArtistList";

const REGION_LABELS: Record<string, string> = {
  jp: "Japan",
  global: "Global",
};

const REGION_ORDER = ["jp", "global"];

type ViewMode = "grid" | "list";

export default function App() {
  const { artists, loading, error } = useArtistList();
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // 初回ロード時に最初のアーティストを選択
  useEffect(() => {
    if (artists.length > 0 && !selectedArtistId) {
      setSelectedArtistId(artists[0].id);
    }
  }, [artists, selectedArtistId]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof artists> = {};
    for (const artist of artists) {
      const region = artist.region ?? "global";
      if (!groups[region]) groups[region] = [];
      groups[region].push(artist);
    }
    return groups;
  }, [artists]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Artist Analytics</h1>
          <div className="header-controls">
            {!loading && (
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                    <rect x="1" y="1" width="6" height="6" rx="1" />
                    <rect x="9" y="1" width="6" height="6" rx="1" />
                    <rect x="1" y="9" width="6" height="6" rx="1" />
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                  </svg>
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                    <rect x="1" y="2" width="14" height="2" rx="0.5" />
                    <rect x="1" y="7" width="14" height="2" rx="0.5" />
                    <rect x="1" y="12" width="14" height="2" rx="0.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main>
        {loading && <div className="loading">Loading</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && viewMode === "grid" && (
          <div className="layout-sidebar">
            <aside className="sidebar">
              {REGION_ORDER.filter((r) => grouped[r]?.length).map((region) => (
                <section key={region} className="region-section">
                  <h2 className="region-title">{REGION_LABELS[region] ?? region}</h2>
                  <ArtistGrid
                    artists={grouped[region]}
                    onSelect={setSelectedArtistId}
                    selectedId={selectedArtistId}
                  />
                </section>
              ))}
            </aside>
            <div className="main-content">
              {selectedArtistId && (
                <Dashboard
                  artistId={selectedArtistId}
                  config={artists.find((a) => a.id === selectedArtistId)}
                />
              )}
            </div>
          </div>
        )}
        {!loading && !error && viewMode === "list" && (
          <div className="layout-list">
            <ArtistTable artists={artists} onSelect={setSelectedArtistId} selectedId={selectedArtistId} />
            <div className="main-content">
              {selectedArtistId && (
                <Dashboard
                  artistId={selectedArtistId}
                  config={artists.find((a) => a.id === selectedArtistId)}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
