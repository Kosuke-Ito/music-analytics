import { useState, useMemo } from "react";
import { Dashboard } from "./components/Dashboard";
import { ArtistGrid } from "./components/ArtistGrid";
import { useArtistList } from "./hooks/useArtistList";

const REGION_LABELS: Record<string, string> = {
  jp: "Japan",
  global: "Global",
};

const REGION_ORDER = ["jp", "global"];

export default function App() {
  const { artists, loading, error } = useArtistList();
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

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
          <div className="header-dot" />
        </div>
      </header>
      <main>
        {loading && <div className="loading">Loading</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && !selectedArtistId &&
          REGION_ORDER.filter((r) => grouped[r]?.length).map((region) => (
            <section key={region} className="region-section fade-in">
              <h2 className="region-title">{REGION_LABELS[region] ?? region}</h2>
              <ArtistGrid artists={grouped[region]} onSelect={setSelectedArtistId} />
            </section>
          ))}
        {selectedArtistId && (
          <Dashboard
            artistId={selectedArtistId}
            onBack={() => setSelectedArtistId(null)}
          />
        )}
      </main>
    </div>
  );
}
