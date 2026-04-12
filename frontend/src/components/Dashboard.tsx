import { useMemo, useState } from "react";
import { AnnotationImpact } from "./AnnotationImpact";
import { AnnotationList } from "./AnnotationList";
import { ListenerChart } from "./ListenerChart";
import { LiveAttendance } from "./LiveAttendance";
import { StatsSummary } from "./StatsSummary";
import { LastfmCountries } from "./LastfmCountries";
import { TopCities } from "./TopCities";
import { OverseasImpact } from "./OverseasImpact";
import { SimilarArtists } from "./SimilarArtists";
import { ArtistMetadataSection } from "./ArtistMetadataSection";
import { useDateRange, type DateRange, type RangeCounts } from "../hooks/useDateRange";
import { aggregateRecords, type Granularity } from "../utils/aggregate";
import type { ArtistConfig, ArtistData } from "../types";

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "daily", label: "日次" },
  { value: "weekly", label: "週次" },
  { value: "monthly", label: "月次" },
];

const RANGE_LABELS: Record<Granularity, { short: string; medium: string; long: string; all: string }> = {
  daily: { short: "7日", medium: "30日", long: "90日", all: "全期間" },
  weekly: { short: "4週", medium: "12週", long: "24週", all: "全期間" },
  monthly: { short: "3ヶ月", medium: "12ヶ月", long: "24ヶ月", all: "全期間" },
};

const RANGE_COUNTS: Record<Granularity, RangeCounts> = {
  daily: { short: 7, medium: 30, long: 90 },
  weekly: { short: 4, medium: 12, long: 24 },
  monthly: { short: 3, medium: 12, long: 24 },
};

const RANGE_KEYS: DateRange[] = ["short", "medium", "long", "all"];

interface DashboardProps {
  artistId: string;
  data?: ArtistData;
  config?: ArtistConfig;
  dataById?: Record<string, ArtistData>;
}

export function Dashboard({ artistId, data, config, dataById }: DashboardProps) {
  if (!data) {
    return (
      <div className="error">
        データがありません（<span className="mono">{artistId}</span>）
      </div>
    );
  }

  const [granularity, setGranularity] = useState<Granularity>("daily");

  const aggregatedAll = useMemo(
    () => aggregateRecords(data.records, granularity),
    [data.records, granularity],
  );

  const { range, setRange, filteredRecords } = useDateRange(
    aggregatedAll,
    RANGE_COUNTS[granularity],
  );

  const dates = useMemo(
    () => new Set(filteredRecords.map((r) => r.date)),
    [filteredRecords],
  );
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
      <div className="dashboard-controls">
        <div className="range-filter">
          {RANGE_KEYS.map((key) => (
            <button
              key={key}
              className={`range-btn ${range === key ? "range-btn--active" : ""}`}
              onClick={() => setRange(key)}
            >
              {RANGE_LABELS[granularity][key]}
            </button>
          ))}
        </div>
        <div className="range-filter">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`range-btn ${granularity === opt.value ? "range-btn--active" : ""}`}
              onClick={() => setGranularity(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
      {dataById && <SimilarArtists artistId={artistId} dataById={dataById} />}
      <ArtistMetadataSection metadata={data.metadata} />
      <LiveAttendance attendance={config?.live_attendance} />
    </div>
  );
}
