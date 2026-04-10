import type { ArtistConfig, ArtistData } from "../types";
import { ArtistGrid } from "./ArtistGrid";

const REGION_LABELS: Record<string, string> = {
  jp: "Japan",
  global: "Global",
};

const REGION_ORDER = ["jp", "global"];

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  labels: string[];
  selectedLabel: string | null;
  onLabelChange: (label: string | null) => void;
  grouped: Record<string, ArtistConfig[]>;
  dataById: Record<string, ArtistData>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  compareMode?: boolean;
  compareIds?: string[];
  onToggleCompare?: (id: string) => void;
}

export function Sidebar({
  searchQuery,
  onSearchChange,
  labels,
  selectedLabel,
  onLabelChange,
  grouped,
  dataById,
  selectedId,
  onSelect,
  compareMode = false,
  compareIds = [],
  onToggleCompare,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      {compareMode && (
        <div className="compare-hint">アーティストをクリックして比較対象を選択</div>
      )}
      <div className="sidebar-filters">
        <input
          className="sidebar-search"
          type="text"
          placeholder="Search artists..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {labels.length > 0 && (
          <div className="sidebar-labels">
            <button
              className={`label-tag ${selectedLabel === null ? "label-tag--active" : ""}`}
              onClick={() => onLabelChange(null)}
            >
              All
            </button>
            {labels.map((label) => (
              <button
                key={label}
                className={`label-tag ${selectedLabel === label ? "label-tag--active" : ""}`}
                onClick={() => onLabelChange(selectedLabel === label ? null : label)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {REGION_ORDER.filter((r) => grouped[r]?.length).map((region) => (
        <section key={region} className="region-section">
          <h2 className="region-title">{REGION_LABELS[region] ?? region}</h2>
          {compareMode ? (
            <div className="artist-grid">
              {grouped[region].map((artist) => (
                <div
                  key={artist.id}
                  className={`artist-card artist-card--compare ${compareIds.includes(artist.id) ? "artist-card--selected" : ""}`}
                  onClick={() => onToggleCompare?.(artist.id)}
                >
                  <span className="artist-card-name">{artist.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <ArtistGrid
              artists={grouped[region]}
              dataById={dataById}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          )}
        </section>
      ))}
    </aside>
  );
}
