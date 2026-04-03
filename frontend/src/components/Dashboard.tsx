import { useArtistData } from "../hooks/useArtistData";
import { AnnotationList } from "./AnnotationList";
import { ListenerChart } from "./ListenerChart";
import { StatsSummary } from "./StatsSummary";

interface DashboardProps {
  artistId: string;
}

export function Dashboard({ artistId }: DashboardProps) {
  const { data, loading, error } = useArtistData(artistId);

  if (loading) {
    return <div className="loading">Loading</div>;
  }

  if (error || !data) {
    return <div className="error">データの取得に失敗しました: {error}</div>;
  }

  return (
    <div className="dashboard fade-in" key={artistId}>
      <div className="detail-header">
        <h2 className="artist-name">{data.artist_name}</h2>
      </div>
      <StatsSummary records={data.records} />
      <div className="chart-section">
        <span className="chart-section-title">Listener Trend</span>
        <ListenerChart records={data.records} annotations={data.annotations} />
      </div>
      <AnnotationList annotations={data.annotations} />
    </div>
  );
}
