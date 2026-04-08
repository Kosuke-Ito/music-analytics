import { useState, useMemo, useEffect, useCallback } from "react";
import { Dashboard } from "./components/Dashboard";
import { ArtistGrid } from "./components/ArtistGrid";
import { ArtistTable } from "./components/ArtistTable";
import { GrowthRanking } from "./components/GrowthRanking";
import { useAggregatedArtistData } from "./hooks/useAggregatedArtistData";
import { useArtistList } from "./hooks/useArtistList";
import { applyArtistToUrl, getArtistIdFromSearch } from "./urlArtist";

const REGION_LABELS: Record<string, string> = {
  jp: "Japan",
  global: "Global",
};

const REGION_ORDER = ["jp", "global"];

type ViewMode = "grid" | "list" | "ranking";

export default function App() {
  const { artists, loading: configLoading, error: configError } = useArtistList();
  const artistIds = useMemo(() => artists.map((a) => a.id), [artists]);
  const dataEnabled = !configLoading && !configError && artistIds.length > 0;
  const {
    dataById,
    loading: dataLoading,
    error: dataError,
  } = useAggregatedArtistData(artistIds, dataEnabled);

  const loading = configLoading || (dataEnabled && dataLoading);
  const error = configError ?? dataError;

  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // URL ?artist= と同期（初回は replace、選択変更は push で履歴に積む）
  useEffect(() => {
    if (artists.length === 0) return;
    const fromUrl = getArtistIdFromSearch(window.location.search);
    const valid =
      fromUrl && artists.some((a) => a.id === fromUrl) ? fromUrl : null;
    if (valid) {
      setSelectedArtistId(valid);
      return;
    }
    const first = artists[0].id;
    setSelectedArtistId(first);
    applyArtistToUrl(first, "replace");
  }, [artists]);

  useEffect(() => {
    const onPopState = () => {
      const id = getArtistIdFromSearch(window.location.search);
      if (!id || artists.length === 0) return;
      if (!artists.some((a) => a.id === id)) return;
      setSelectedArtistId(id);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [artists]);

  const selectArtist = useCallback((id: string) => {
    setSelectedArtistId(id);
    applyArtistToUrl(id, "push");
  }, []);

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
                <button
                  className={`view-toggle-btn ${viewMode === "ranking" ? "active" : ""}`}
                  onClick={() => setViewMode("ranking")}
                  title="Growth Ranking"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                    <rect x="1" y="10" width="4" height="5" rx="0.5" />
                    <rect x="6" y="4" width="4" height="11" rx="0.5" />
                    <rect x="11" y="1" width="4" height="14" rx="0.5" />
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
                    dataById={dataById}
                    onSelect={selectArtist}
                    selectedId={selectedArtistId}
                  />
                </section>
              ))}
            </aside>
            <div className="main-content">
              {selectedArtistId && (
                <Dashboard
                  artistId={selectedArtistId}
                  data={dataById[selectedArtistId]}
                  config={artists.find((a) => a.id === selectedArtistId)}
                />
              )}
            </div>
          </div>
        )}
        {!loading && !error && viewMode === "list" && (
          <div className="layout-list">
            <ArtistTable
              artists={artists}
              dataById={dataById}
              onSelect={selectArtist}
              selectedId={selectedArtistId}
            />
            <div className="main-content">
              {selectedArtistId && (
                <Dashboard
                  artistId={selectedArtistId}
                  data={dataById[selectedArtistId]}
                  config={artists.find((a) => a.id === selectedArtistId)}
                />
              )}
            </div>
          </div>
        )}
        {!loading && !error && viewMode === "ranking" && (
          <GrowthRanking artists={artists} dataById={dataById} onSelect={selectArtist} />
        )}
      </main>
    </div>
  );
}
