import { Dashboard } from "./components/Dashboard";

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Artist Analytics</h1>
      </header>
      <main>
        <Dashboard artistId="lausbub" />
      </main>
    </div>
  );
}
