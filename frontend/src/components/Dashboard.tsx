import { useArtistData } from "../hooks/useArtistData";
import { ListenerChart } from "./ListenerChart";
import { StatsSummary } from "./StatsSummary";

interface DashboardProps {
  artistId: string;
  onBack: () => void;
}

export function Dashboard({ artistId, onBack }: DashboardProps) {
  const { data, loading, error } = useArtistData(artistId);

  if (loading) {
    return <div className="loading">Loading</div>;
  }

  if (error || !data) {
    return <div className="error">データの取得に失敗しました: {error}</div>;
  }

  return (
    <div className="dashboard fade-in">
      <button className="detail-back" onClick={onBack}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3L5 8l5 5" />
        </svg>
        All Artists
      </button>
      <div className="detail-header">
        <h2 className="artist-name">{data.artist_name}</h2>
      </div>
      <StatsSummary records={data.records} />
      <div className="chart-section">
        <span className="chart-section-title">Listener Trend</span>
        <ListenerChart records={data.records} />
      </div>
    </div>
  );
}
