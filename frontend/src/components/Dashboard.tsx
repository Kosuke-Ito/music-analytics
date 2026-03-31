import { useArtistData } from "../hooks/useArtistData";
import { ListenerChart } from "./ListenerChart";
import { StatsSummary } from "./StatsSummary";

interface DashboardProps {
  artistId: string;
}

export function Dashboard({ artistId }: DashboardProps) {
  const { data, loading, error } = useArtistData(artistId);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error || !data) {
    return <div className="error">データの取得に失敗しました: {error}</div>;
  }

  return (
    <div className="dashboard">
      <h2 className="artist-name">{data.artist_name}</h2>
      <StatsSummary records={data.records} />
      <ListenerChart records={data.records} />
    </div>
  );
}
