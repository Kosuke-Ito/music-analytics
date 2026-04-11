import type { ListenerRecord } from "../types";
import { formatNumber } from "../utils/format";

interface LastfmStatsProps {
  record?: ListenerRecord;
}

export function LastfmCountries({ record }: LastfmStatsProps) {
  if (!record?.lastfm_listeners && !record?.lastfm_playcount) return null;

  return (
    <div className="stats-group">
      <div className="stats-group-title">Last.fm</div>
      <div className="stats-summary">
        {record.lastfm_listeners != null && (
          <div className="stat-card">
            <span className="stat-label stat-label--tooltip">
              Listeners <span className="stat-help">?</span>
              <span className="stat-tooltip"><strong>Last.fm Listeners</strong><br />⚠️ Last.fm を使うヘビーリスナー中心のサンプルです。全体のリスナー数ではなく、熱心なリスナー層の指標として読む。日本ユーザーは少なめなので、グローバル傾向を見るのに有効。</span>
            </span>
            <span className="stat-value">{formatNumber(record.lastfm_listeners)}</span>
          </div>
        )}
        {record.lastfm_playcount != null && (
          <div className="stat-card">
            <span className="stat-label stat-label--tooltip">
              Total Scrobbles <span className="stat-help">?</span>
              <span className="stat-tooltip"><strong>Total Scrobbles（累計再生回数）</strong><br />Last.fmに連携されたユーザーがこのアーティストを再生した累計回数。Spotifyでは取れない「累計プレイ」がわかる貴重な指標。</span>
            </span>
            <span className="stat-value">{formatNumber(record.lastfm_playcount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
