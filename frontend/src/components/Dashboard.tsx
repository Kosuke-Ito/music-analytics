import { useArtistData } from "../hooks/useArtistData";
import { AnnotationList } from "./AnnotationList";
import { ListenerChart } from "./ListenerChart";
import { LiveAttendance } from "./LiveAttendance";
import { StatsSummary } from "./StatsSummary";
import { TopCities } from "./TopCities";
import type { ArtistConfig } from "../types";

interface DashboardProps {
  artistId: string;
  config?: ArtistConfig;
}

export function Dashboard({ artistId, config }: DashboardProps) {
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
      <TopCities cities={data.records[data.records.length - 1]?.top_cities} />
      <LiveAttendance attendance={config?.live_attendance} />
      <AnnotationList annotations={data.annotations} />
    </div>
  );
}
