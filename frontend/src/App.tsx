import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { ArtistGrid } from "./components/ArtistGrid";
import { useArtistList } from "./hooks/useArtistList";

export default function App() {
  const { artists, loading, error } = useArtistList();
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

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
        {!loading && !error && !selectedArtistId && (
          <ArtistGrid artists={artists} onSelect={setSelectedArtistId} />
        )}
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
