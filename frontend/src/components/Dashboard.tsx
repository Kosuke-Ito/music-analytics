import { useMemo, useState } from "react";
import { AnnotationImpact } from "./AnnotationImpact";
import { AnnotationList } from "./AnnotationList";
import { ListenerChart } from "./ListenerChart";
import { LiveAttendance } from "./LiveAttendance";
import { StatsSummary } from "./StatsSummary";
import { LastfmCountries } from "./LastfmCountries";
import { TopCities } from "./TopCities";
import type { ArtistConfig, ArtistData } from "../types";

interface DashboardProps {
  artistId: string;
  /** 親でまとめ取得済みのデータ（無ければ未取得として扱う） */
  data?: ArtistData;
  config?: ArtistConfig;
}

export function Dashboard({ artistId, data, config }: DashboardProps) {
  if (!data) {
    return (
      <div className="error">
        データがありません（<span className="mono">{artistId}</span>）
      </div>
    );
  }

  const dates = useMemo(() => new Set(data.records.map((r) => r.date)), [data.records]);
  const visibleAnnotations = useMemo(
    () => data.annotations?.filter((a) => dates.has(a.date)) ?? [],
    [data.annotations, dates],
  );
  const [hoveredAnnotation, setHoveredAnnotation] = useState<number | null>(null);

  return (
    <div className="dashboard fade-in" key={artistId}>
      <div className="detail-header">
        <h2 className="artist-name">{data.artist_name}</h2>
        <span className="detail-last-updated">
          {data.records[data.records.length - 1]?.date}
        </span>
      </div>
      <StatsSummary records={data.records} />
      <LastfmCountries record={data.records[data.records.length - 1]} />
      <div className="chart-section">
        <span className="chart-section-title">Listener Trend</span>
        <ListenerChart
          records={data.records}
          visibleAnnotations={visibleAnnotations}
          hoveredAnnotation={hoveredAnnotation}
          onHoverAnnotation={setHoveredAnnotation}
        />
      </div>
      <AnnotationList
        annotations={data.annotations}
        visibleAnnotations={visibleAnnotations}
        hoveredAnnotation={hoveredAnnotation}
        onHoverAnnotation={setHoveredAnnotation}
      />
      <AnnotationImpact records={data.records} annotations={data.annotations} />
      <TopCities cities={data.records[data.records.length - 1]?.top_cities} />
      <LiveAttendance attendance={config?.live_attendance} />
    </div>
  );
}
