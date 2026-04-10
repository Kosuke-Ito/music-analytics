import { useMemo, useState } from "react";
import { AnnotationImpact } from "./AnnotationImpact";
import { AnnotationList } from "./AnnotationList";
import { ListenerChart } from "./ListenerChart";
import { LiveAttendance } from "./LiveAttendance";
import { StatsSummary } from "./StatsSummary";
import { LastfmCountries } from "./LastfmCountries";
import { TopCities } from "./TopCities";
import { OverseasImpact } from "./OverseasImpact";
import { useDateRange, type DateRange } from "../hooks/useDateRange";
import type { ArtistConfig, ArtistData } from "../types";

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7日" },
  { value: "30d", label: "30日" },
  { value: "90d", label: "90日" },
  { value: "all", label: "全期間" },
];

interface DashboardProps {
  artistId: string;
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

  const { range, setRange, filteredRecords } = useDateRange(data.records);

  const dates = useMemo(() => new Set(filteredRecords.map((r) => r.date)), [filteredRecords]);
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
      <div className="range-filter">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`range-btn ${range === opt.value ? "range-btn--active" : ""}`}
            onClick={() => setRange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <StatsSummary records={filteredRecords} />
      <LastfmCountries record={data.records[data.records.length - 1]} />
      <div className="chart-section">
        <span className="chart-section-title">Listener Trend</span>
        <ListenerChart
          records={filteredRecords}
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
      <AnnotationImpact records={filteredRecords} annotations={data.annotations} />
      <TopCities
        cities={data.records[data.records.length - 1]?.top_cities}
        prevCities={data.records.length >= 2 ? data.records[data.records.length - 2]?.top_cities : undefined}
      />
      <OverseasImpact records={filteredRecords} />
      <LiveAttendance attendance={config?.live_attendance} />
    </div>
  );
}
