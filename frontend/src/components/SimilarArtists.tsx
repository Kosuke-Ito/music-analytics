import { useMemo } from "react";
import type { ArtistData } from "../types";
import { findSimilarArtists } from "../utils/similarity";

interface SimilarArtistsProps {
  artistId: string;
  dataById: Record<string, ArtistData>;
}

const COUNTRY_FLAGS: Record<string, string> = {
  JP: "🇯🇵", US: "🇺🇸", GB: "🇬🇧", KR: "🇰🇷", MX: "🇲🇽", BR: "🇧🇷",
  TW: "🇹🇼", ID: "🇮🇩", IN: "🇮🇳", DE: "🇩🇪", FR: "🇫🇷", AU: "🇦🇺",
  CA: "🇨🇦", TH: "🇹🇭", PH: "🇵🇭", ES: "🇪🇸", IT: "🇮🇹", CL: "🇨🇱",
  AR: "🇦🇷", CO: "🇨🇴", PE: "🇵🇪", SG: "🇸🇬", MY: "🇲🇾", TR: "🇹🇷",
  SE: "🇸🇪", NL: "🇳🇱", PL: "🇵🇱", NG: "🇳🇬", ZA: "🇿🇦", EG: "🇪🇬",
};

export function SimilarArtists({ artistId, dataById }: SimilarArtistsProps) {
  const similar = useMemo(
    () => findSimilarArtists(artistId, dataById, 5),
    [artistId, dataById],
  );

  if (similar.length === 0) return null;

  return (
    <div className="similar-section">
      <span className="chart-section-title">
        似ているアーティスト
        <span className="section-help" title="Top Cities（上位5都市）の国別リスナー分布に基づくコサイン類似度で算出。ファン層が似ているアーティストを発見し、コラボやタイアップの候補として活用できます。"> ⓘ</span>
      </span>
      <div className="similar-list">
        {similar.map((item) => (
          <div key={item.artistId} className="similar-item">
            <div className="similar-info">
              <span className="similar-name">{item.artistName}</span>
              <span className="similar-countries">
                {item.sharedCountries.map((c) => (
                  <span key={c} className="similar-country-flag">
                    {COUNTRY_FLAGS[c] ?? c}
                  </span>
                ))}
              </span>
            </div>
            <div className="similar-score">
              <div className="similar-bar-wrapper">
                <div
                  className="similar-bar"
                  style={{ width: `${item.similarity * 100}%` }}
                />
              </div>
              <span className="similar-pct">{(item.similarity * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
