import { Dashboard } from "./components/Dashboard";
import { useArtistList } from "./hooks/useArtistList";

export default function App() {
  const { artists, loading, error } = useArtistList();

  return (
    <div className="app">
      <header className="header">
        <h1>Artist Analytics</h1>
      </header>
      <main>
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">設定の読み込みに失敗しました: {error}</div>}
        {artists.map((artist) => (
          <Dashboard key={artist.id} artistId={artist.id} />
        ))}
      </main>
    </div>
  );
}
