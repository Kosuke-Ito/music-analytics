import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Dashboard } from "./components/Dashboard";
import { Sidebar } from "./components/Sidebar";
import { ArtistTable } from "./components/ArtistTable";
import { BuzzAlerts } from "./components/BuzzAlerts";
import { useAggregatedArtistData } from "./hooks/useAggregatedArtistData";
import { useArtistList } from "./hooks/useArtistList";
import { useArtistFilter } from "./hooks/useArtistFilter";
import { useUrlSync } from "./hooks/useUrlSync";

const ArtistComparison = lazy(() =>
  import("./components/ArtistComparison").then((m) => ({ default: m.ArtistComparison })),
);
const GrowthRanking = lazy(() =>
  import("./components/GrowthRanking").then((m) => ({ default: m.GrowthRanking })),
);
const AddArtistForm = lazy(() =>
  import("./components/AddArtistForm").then((m) => ({ default: m.AddArtistForm })),
);

type ViewMode = "grid" | "list" | "ranking" | "compare";

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

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAddForm, setShowAddForm] = useState(false);

  const { selectedId: selectedArtistId, selectArtist } = useUrlSync(artists);

  const {
    searchQuery, setSearchQuery,
    selectedLabel, setSelectedLabel,
    labels, grouped,
  } = useArtistFilter(artists);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectedConfig = useMemo(
    () => artists.find((a) => a.id === selectedArtistId),
    [artists, selectedArtistId]
  );

  const sidebarProps = {
    searchQuery,
    onSearchChange: setSearchQuery,
    labels,
    selectedLabel,
    onLabelChange: setSelectedLabel,
    grouped,
    dataById,
    selectedId: selectedArtistId,
    onSelect: selectArtist,
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Artist Analytics</h1>
          <button
            className="add-artist-btn"
            onClick={() => setShowAddForm(true)}
            title="Add Artist"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <rect x="7" y="2" width="2" height="12" rx="1" />
              <rect x="2" y="7" width="12" height="2" rx="1" />
            </svg>
            Add Artist
          </button>
        </div>
        {!loading && (
          <nav className="view-tabs">
            <button className={`view-tab ${viewMode === "grid" ? "view-tab--active" : ""}`} onClick={() => setViewMode("grid")}>
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
              カード
            </button>
            <button className={`view-tab ${viewMode === "list" ? "view-tab--active" : ""}`} onClick={() => setViewMode("list")}>
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <rect x="1" y="2" width="14" height="2" rx="0.5" />
                <rect x="1" y="7" width="14" height="2" rx="0.5" />
                <rect x="1" y="12" width="14" height="2" rx="0.5" />
              </svg>
              テーブル
            </button>
            <button className={`view-tab ${viewMode === "ranking" ? "view-tab--active" : ""}`} onClick={() => setViewMode("ranking")}>
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <rect x="1" y="10" width="4" height="5" rx="0.5" />
                <rect x="6" y="4" width="4" height="11" rx="0.5" />
                <rect x="11" y="1" width="4" height="14" rx="0.5" />
              </svg>
              ランキング
            </button>
            <button className={`view-tab ${viewMode === "compare" ? "view-tab--active" : ""}`} onClick={() => setViewMode("compare")}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                <polyline points="1,12 4,6 8,9 12,3 15,5" />
                <polyline points="1,14 5,10 9,12 13,7 15,9" />
              </svg>
              比較
            </button>
          </nav>
        )}
      </header>
      {showAddForm && (
        <Suspense fallback={null}>
          <AddArtistForm onClose={() => setShowAddForm(false)} />
        </Suspense>
      )}
      <main>
        {loading && <div className="loading">Loading</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && (
          <BuzzAlerts artists={artists} dataById={dataById} />
        )}
        {!loading && !error && viewMode === "grid" && (
          <div className="layout-sidebar">
            <Sidebar {...sidebarProps} />
            <div className="main-content">
              {selectedArtistId && (
                <Dashboard
                  artistId={selectedArtistId}
                  data={dataById[selectedArtistId]}
                  config={selectedConfig}
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
                  config={selectedConfig}
                />
              )}
            </div>
          </div>
        )}
        {!loading && !error && viewMode === "ranking" && (
          <Suspense fallback={<div className="loading">Loading</div>}>
            <GrowthRanking artists={artists} dataById={dataById} onSelect={selectArtist} />
          </Suspense>
        )}
        {!loading && !error && viewMode === "compare" && (
          <div className="layout-sidebar">
            <Sidebar
              {...sidebarProps}
              compareMode
              compareIds={compareIds}
              onToggleCompare={toggleCompare}
            />
            <div className="main-content">
              <Suspense fallback={<div className="loading">Loading</div>}>
                <ArtistComparison artistIds={compareIds} dataById={dataById} />
              </Suspense>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
