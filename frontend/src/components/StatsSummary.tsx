import type { ListenerRecord } from "../types";
import { calculateRetentionScore, calculateYouTubeEfficiency } from "../utils/metrics";
import { formatNumber, formatCompact, formatPct } from "../utils/format";

interface StatsSummaryProps {
  records: ListenerRecord[];
}

export function StatsSummary({ records }: StatsSummaryProps) {
  if (records.length === 0) {
    return (
      <div className="stats-groups">
        <div className="stats-group">
          <div className="stats-group-title">Spotify</div>
          <div className="stats-summary">
            <div className="stat-card">
              <span className="stat-label">Monthly Listeners</span>
              <span className="stat-value">-</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = records[records.length - 1];
  const previous = records.length >= 2 ? records[records.length - 2] : null;
  const weekAgo = records.length > 7 ? records[records.length - 8] : null;

  const listenerChange = previous
    ? current.monthly_listeners - previous.monthly_listeners
    : null;
  const listenerWeekChange = weekAgo
    ? current.monthly_listeners - weekAgo.monthly_listeners
    : null;
  const listenerWeekPct =
    weekAgo && weekAgo.monthly_listeners > 0
      ? ((current.monthly_listeners - weekAgo.monthly_listeners) / weekAgo.monthly_listeners) * 100
      : null;

  const subscriberChange =
    previous?.youtube_subscribers != null && current.youtube_subscribers != null
      ? current.youtube_subscribers - previous.youtube_subscribers
      : null;

  const dataWarning = current.validation_flags?.includes("large_monthly_listener_delta");
  const hasYoutube = current.youtube_subscribers != null;
  const hasYoutubeMusic = current.ytm_subscribers != null || current.ytm_monthly_listeners != null;

  const retention = calculateRetentionScore(current.spotify_followers, current.monthly_listeners);
  const ytEfficiency = calculateYouTubeEfficiency(current.youtube_total_views, current.youtube_subscribers);

  return (
    <div className="stats-groups">
      {dataWarning && (
        <div className="stat-card stat-warning" style={{ marginBottom: 16 }}>
          <span className="stat-label">Data quality</span>
          <span className="stat-value">
            前回比でリスナー変動が大きいです（記録は保存済み・要確認）
          </span>
        </div>
      )}

      <div className="stats-group">
        <div className="stats-group-title">Spotify</div>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-label stat-label--tooltip">
              Monthly Listeners <span className="stat-help">?</span>
              <span className="stat-tooltip"><strong>Monthly Listeners（月間リスナー数）</strong><br />過去28日間にこのアーティストの楽曲を1回以上再生したユニークユーザー数。Spotifyで最も重視される指標の一つで、リアルタイムなリスナー規模を表す。</span>
            </span>
            <span className="stat-value">{formatNumber(current.monthly_listeners)}</span>
          </div>
          {current.spotify_followers != null && (
            <div className="stat-card">
              <span className="stat-label stat-label--tooltip">
                Followers <span className="stat-help">?</span>
                <span className="stat-tooltip"><strong>Followers（フォロワー数）</strong><br />Spotifyでこのアーティストをフォローしているユーザー数。新譜リリース時に通知が届くコアファン。Monthly Listenersに対する比率（Fan Retention）でファン層の質が分かる。</span>
              </span>
              <span className="stat-value">{formatNumber(current.spotify_followers)}</span>
            </div>
          )}
          {listenerChange !== null && (
            <div className="stat-card">
              <span className="stat-label">前日比</span>
              <span className={`stat-value ${listenerChange >= 0 ? "positive" : "negative"}`}>
                {listenerChange >= 0 ? "+" : ""}
                {formatNumber(listenerChange)}
              </span>
            </div>
          )}
          {listenerWeekChange !== null && (
            <div className="stat-card">
              <span className="stat-label">7日比</span>
              <span className={`stat-value ${listenerWeekChange >= 0 ? "positive" : "negative"}`}>
                {listenerWeekChange >= 0 ? "+" : ""}
                {formatNumber(listenerWeekChange)}
                {listenerWeekPct !== null && (
                  <span className="stat-sub"> ({formatPct(listenerWeekPct)})</span>
                )}
              </span>
            </div>
          )}
          {retention !== null && (
            <div className="stat-card">
              <span className="stat-label stat-label--tooltip">
                Fan Retention <span className="stat-help">?</span>
                <span className="stat-tooltip"><strong>Fan Retention（ファン定着率）</strong><br />フォロワー数 ÷ 月間リスナー数の比率。高いほどリスナーがフォローまでしているコアファンが多い。低い場合はプレイリスト経由など一時的に聴いているカジュアルリスナーが中心。</span>
              </span>
              <span className="stat-value">{retention.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {(hasYoutube || hasYoutubeMusic) && (
        <div className="stats-group">
          <div className="stats-group-title">YouTube</div>
          <div className="stats-summary">
            {current.ytm_monthly_listeners != null && (
              <div className="stat-card">
                <span className="stat-label stat-label--tooltip">
                  Monthly Listeners <span className="stat-help">?</span>
                  <span className="stat-tooltip"><strong>YouTube Music Monthly Listeners</strong><br />YouTube Music で過去28日間にこのアーティストを聴いたユニークユーザー数。Spotify の月間リスナーに相当する重要指標。</span>
                </span>
                <span className="stat-value">{formatNumber(current.ytm_monthly_listeners)}</span>
              </div>
            )}
            {hasYoutube && (
              <div className="stat-card">
                <span className="stat-label stat-label--tooltip">
                  Subscribers <span className="stat-help">?</span>
                  <span className="stat-tooltip"><strong>チャンネル登録者数</strong><br />⚠️ YouTube APIは丸めた値を返します（100万超は万単位）。長期トレンドで見るのが重要。</span>
                </span>
                <span className="stat-value">{formatNumber(current.youtube_subscribers!)}</span>
              </div>
            )}
            {current.youtube_total_views != null && (
              <div className="stat-card">
                <span className="stat-label">Total Views</span>
                <span className="stat-value">{formatCompact(current.youtube_total_views)}</span>
              </div>
            )}
            {subscriberChange !== null && (
              <div className="stat-card">
                <span className="stat-label">前日比</span>
                <span className={`stat-value ${subscriberChange >= 0 ? "positive" : "negative"}`}>
                  {subscriberChange >= 0 ? "+" : ""}
                  {formatNumber(subscriberChange)}
                </span>
              </div>
            )}
            {ytEfficiency !== null && (
              <div className="stat-card">
                <span className="stat-label stat-label--tooltip">
                  Efficiency <span className="stat-help">?</span>
                  <span className="stat-tooltip"><strong>Efficiency（視聴効率）</strong><br />総再生回数 ÷ チャンネル登録者数。高いほどコンテンツがアクティブに視聴されている。</span>
                </span>
                <span className="stat-value">{ytEfficiency.toFixed(1)} <span className="stat-sub">views/sub</span></span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
