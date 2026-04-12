import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from collector.scraper import ScrapingError, ScrapingResult, scrape_monthly_listeners
from collector.storage import add_buzz_event, add_record, add_song_performance, evaluate_monthly_listeners, load_data, save_data, update_metadata
from collector.buzz import detect_buzz_events
from collector.lastfm import LastfmError, fetch_lastfm_stats
from collector.youtube import YouTubeError, fetch_youtube_stats, fetch_video_stats
from collector.youtube_music import YouTubeMusicError, fetch_youtube_music_stats

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "scripts" / "config.json"
DATA_DIR = PROJECT_ROOT / "data"

SPOTIFY_MAX_ATTEMPTS = 3
SPOTIFY_RETRY_SLEEP_SEC = 5


def scrape_monthly_listeners_with_retry(spotify_artist_id: str) -> ScrapingResult:
    # Spotify スクレイピングを数回までリトライする。
    last_err: ScrapingError | None = None
    for attempt in range(1, SPOTIFY_MAX_ATTEMPTS + 1):
        try:
            return scrape_monthly_listeners(spotify_artist_id)
        except ScrapingError as e:
            last_err = e
            logger.warning(f"Spotify取得失敗 ({attempt}/{SPOTIFY_MAX_ATTEMPTS}): {e}")
            if attempt < SPOTIFY_MAX_ATTEMPTS:
                time.sleep(SPOTIFY_RETRY_SLEEP_SEC)
    assert last_err is not None
    raise last_err


def filter_artists(artists: list[dict], artist_id: str | None) -> list[dict]:
    # artist_id が指定されていればそのIDに一致するアーティストだけ返す。
    # 空文字・None は「全件」として扱う。
    if not artist_id:
        return artists
    return [a for a in artists if a.get("id") == artist_id]


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect artist metrics from Spotify/YouTube/Last.fm")
    parser.add_argument(
        "--artist-id",
        dest="artist_id",
        default=None,
        help="指定したアーティストIDのみ収集する (config.json の id と一致)",
    )
    return parser.parse_args(argv)


def collect_all(artist_id: str | None = None) -> None:
    # config.jsonの全アーティストのデータを収集する。
    # artist_id を指定した場合はそのアーティストのみ対象とする。
    config = json.loads(CONFIG_PATH.read_text())
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    youtube_api_key = os.environ.get("YOUTUBE_API_KEY")
    lastfm_api_key = os.environ.get("LASTFM_API_KEY")

    targets = filter_artists(config["artists"], artist_id)
    if artist_id and not targets:
        logger.error(f"指定されたアーティストが見つかりません: {artist_id}")
        sys.exit(1)

    # 収集統計
    stats = {"success": [], "spotify_fail": [], "youtube_fail": [], "lastfm_fail": [], "ytm_fail": []}
    start_time = time.time()

    for artist in targets:
        aid = artist["id"]
        spotify_id = artist["spotify_artist_id"]
        youtube_channel_id = artist.get("youtube_channel_id")
        name = artist["name"]
        data_path = DATA_DIR / f"{aid}.json"

        logger.info(f"Spotify 収集開始: {name}")
        try:
            result = scrape_monthly_listeners_with_retry(spotify_id)
        except ScrapingError as e:
            logger.error(f"Spotify スクレイピング失敗: {name} - {e}")
            stats["spotify_fail"].append(name)
            continue

        data = load_data(data_path, artist_id=spotify_id, artist_name=name)

        previous_listeners = None
        history: list[int] = []
        if data["records"]:
            previous_listeners = data["records"][-1]["monthly_listeners"]
            # 過去30日分の履歴（当日を含まない最新側）
            history = [
                r["monthly_listeners"]
                for r in data["records"][-30:]
                if isinstance(r.get("monthly_listeners"), int)
            ]

        ok, validation_flags = evaluate_monthly_listeners(
            result.monthly_listeners, previous_listeners, history=history
        )
        if not ok:
            logger.warning(f"リスナー数が無効のためスキップ: {name} - {result.monthly_listeners} 件")
            continue

        youtube_subscribers = None
        youtube_total_views = None
        youtube_video_count = None
        if youtube_api_key and youtube_channel_id:
            logger.info(f"YouTube 収集開始: {name}")
            try:
                yt_stats = fetch_youtube_stats(
                    youtube_channel_id, api_key=youtube_api_key
                )
                youtube_subscribers = yt_stats.subscribers
                youtube_total_views = yt_stats.total_views
                youtube_video_count = yt_stats.video_count
                logger.info(
                    f"YouTube収集完了: {name} - {youtube_subscribers:,} 人の購読者, "
                    f"{youtube_total_views:,} views, {youtube_video_count} videos"
                )
            except (YouTubeError, Exception) as e:
                logger.warning(f"YouTube取得失敗: {name} - {e}")
                stats["youtube_fail"].append(name)

        # Last.fm収集
        lastfm_listeners = None
        lastfm_playcount = None
        if lastfm_api_key:
            logger.info(f"Last.fm収集開始: {name}")
            try:
                lfm_stats = fetch_lastfm_stats(name, api_key=lastfm_api_key)
                lastfm_listeners = lfm_stats.listeners
                lastfm_playcount = lfm_stats.playcount
                # メタデータ保存（similar_artists, tags）
                if lfm_stats.similar_artists:
                    update_metadata(data, "lastfm_similar_artists", lfm_stats.similar_artists)
                if lfm_stats.tags:
                    update_metadata(data, "lastfm_tags", lfm_stats.tags)
                logger.info(f"Last.fm収集完了: {name} - {lastfm_listeners:,} listeners, {lastfm_playcount:,} plays")
            except (LastfmError, Exception) as e:
                logger.warning(f"Last.fm取得失敗: {name} - {e}")
                stats["lastfm_fail"].append(name)

        # YouTube Music 収集（unofficial API、認証不要）
        ytm_subscribers = None
        ytm_monthly_listeners = None
        ytm_total_views = None
        logger.info(f"YouTube Music 収集開始: {name}")
        try:
            ytm_browse_id = artist.get("ytm_browse_id")
            ytm_stats = fetch_youtube_music_stats(name, browse_id=ytm_browse_id)
            ytm_subscribers = ytm_stats.subscribers
            ytm_monthly_listeners = ytm_stats.monthly_listeners
            ytm_total_views = ytm_stats.total_views
            # メタデータ保存（related_artists, top_songs, description）
            if ytm_stats.related_artists:
                update_metadata(data, "ytm_related_artists", [
                    r.to_dict() for r in ytm_stats.related_artists
                ])
            if ytm_stats.top_songs:
                update_metadata(data, "ytm_top_songs", ytm_stats.top_songs)
            if ytm_stats.description:
                update_metadata(data, "ytm_description", ytm_stats.description)
            logger.info(
                f"YouTube Music収集完了: {name} - "
                f"{ytm_subscribers:,} subs, {ytm_monthly_listeners:,} monthly, {ytm_total_views:,} views"
                f", {len(ytm_stats.related_artists)} related"
            )
        except (YouTubeMusicError, Exception) as e:
            logger.warning(f"YouTube Music取得失敗: {name} - {e}")
            stats["ytm_fail"].append(name)

        # 楽曲統計の収集（YouTube Data API v3 videos.list）
        if youtube_api_key and ytm_stats and ytm_stats.top_songs:
            video_ids = [s["video_id"] for s in ytm_stats.top_songs if s.get("video_id")]
            if video_ids:
                try:
                    v_stats = fetch_video_stats(video_ids, api_key=youtube_api_key)
                    song_entries = []
                    for vs in v_stats:
                        title = next(
                            (s["title"] for s in ytm_stats.top_songs if s["video_id"] == vs.video_id),
                            "",
                        )
                        song_entries.append({
                            "video_id": vs.video_id,
                            "title": title,
                            "views": vs.view_count,
                            "likes": vs.like_count,
                            "comments": vs.comment_count,
                        })
                    add_song_performance(data, today, song_entries)
                    logger.info(f"楽曲統計収集完了: {name} - {len(song_entries)} 曲")
                except Exception as e:
                    logger.warning(f"楽曲統計取得失敗: {name} - {e}")

        data = add_record(
            data,
            result,
            date=today,
            youtube_subscribers=youtube_subscribers,
            youtube_total_views=youtube_total_views,
            youtube_video_count=youtube_video_count,
            lastfm_listeners=lastfm_listeners,
            lastfm_playcount=lastfm_playcount,
            ytm_subscribers=ytm_subscribers,
            ytm_monthly_listeners=ytm_monthly_listeners,
            ytm_total_views=ytm_total_views,
            validation_flags=validation_flags or None,
        )
        # バズ検知
        new_buzz = detect_buzz_events(
            records=data["records"],
            annotations=data.get("annotations", []),
            past_buzz_events=data.get("buzz_events", []),
        )
        for event in new_buzz:
            add_buzz_event(data, event.to_dict())
            logger.info(
                f"🔥 バズ検知: {name} - {event.metric} "
                f"(score={event.score}, type={event.type})"
            )

        save_data(data_path, data)
        stats["success"].append(name)
        logger.info(
            f"収集完了: {name} - {result.monthly_listeners:,} listeners, "
            f"{result.followers:,} followers"
            + (f", {youtube_subscribers:,} subscribers" if youtube_subscribers else "")
            + (f" [flags: {validation_flags}]" if validation_flags else "")
        )

    # 収集統計サマリー
    elapsed = time.time() - start_time
    logger.info("=" * 50)
    logger.info(f"📊 収集完了サマリー ({elapsed:.0f}秒)")
    logger.info(f"  ✅ 成功: {len(stats['success'])}/{len(targets)}")
    if stats["spotify_fail"]:
        logger.warning(f"  ❌ Spotify失敗: {', '.join(stats['spotify_fail'])}")
    if stats["youtube_fail"]:
        logger.warning(f"  ⚠️  YouTube失敗: {', '.join(stats['youtube_fail'])}")
    if stats["lastfm_fail"]:
        logger.warning(f"  ⚠️  Last.fm失敗: {', '.join(stats['lastfm_fail'])}")
    if stats["ytm_fail"]:
        logger.warning(f"  ⚠️  YTM失敗: {', '.join(stats['ytm_fail'])}")
    logger.info("=" * 50)


if __name__ == "__main__":
    args = parse_args()
    try:
        collect_all(artist_id=args.artist_id)
    except Exception as e:
        logger.error(f"予期しないエラー: {e}")
        sys.exit(1)
