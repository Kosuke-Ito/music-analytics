import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from collector.scraper import ScrapingError, ScrapingResult, scrape_monthly_listeners
from collector.storage import add_record, evaluate_monthly_listeners, load_data, save_data
from collector.lastfm import LastfmError, fetch_lastfm_stats
from collector.youtube import YouTubeError, fetch_youtube_stats

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


def collect_all() -> None:
    # config.jsonの全アーティストのデータを収集する。
    config = json.loads(CONFIG_PATH.read_text())
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    youtube_api_key = os.environ.get("YOUTUBE_API_KEY")
    lastfm_api_key = os.environ.get("LASTFM_API_KEY")

    for artist in config["artists"]:
        artist_id = artist["id"]
        spotify_id = artist["spotify_artist_id"]
        youtube_channel_id = artist.get("youtube_channel_id")
        name = artist["name"]
        data_path = DATA_DIR / f"{artist_id}.json"

        logger.info(f"Spotify 収集開始: {name}")
        try:
            result = scrape_monthly_listeners_with_retry(spotify_id)
        except ScrapingError as e:
            logger.error(f"Spotify スクレイピング失敗: {name} - {e}")
            continue

        data = load_data(data_path, artist_id=spotify_id, artist_name=name)

        previous_listeners = None
        if data["records"]:
            previous_listeners = data["records"][-1]["monthly_listeners"]

        ok, validation_flags = evaluate_monthly_listeners(
            result.monthly_listeners, previous_listeners
        )
        if not ok:
            logger.warning(f"リスナー数が無効のためスキップ: {name} - {result.monthly_listeners} 件")
            continue

        youtube_subscribers = None
        youtube_total_views = None
        if youtube_api_key and youtube_channel_id:
            logger.info(f"YouTube 収集開始: {name}")
            try:
                yt_stats = fetch_youtube_stats(
                    youtube_channel_id, api_key=youtube_api_key
                )
                youtube_subscribers = yt_stats.subscribers
                youtube_total_views = yt_stats.total_views
                logger.info(
                    f"YouTube収集完了: {name} - {youtube_subscribers:,} 人の購読者, "
                    f"{youtube_total_views:,} views"
                )
            except (YouTubeError, Exception) as e:
                logger.warning(f"YouTube取得失敗: {name} - {e}")

        # Last.fm収集
        lastfm_listeners = None
        lastfm_playcount = None
        if lastfm_api_key:
            logger.info(f"Last.fm収集開始: {name}")
            try:
                lfm_stats = fetch_lastfm_stats(name, api_key=lastfm_api_key)
                lastfm_listeners = lfm_stats.listeners
                lastfm_playcount = lfm_stats.playcount
                logger.info(f"Last.fm収集完了: {name} - {lastfm_listeners:,} listeners, {lastfm_playcount:,} plays")
            except (LastfmError, Exception) as e:
                logger.warning(f"Last.fm取得失敗: {name} - {e}")

        data = add_record(
            data,
            result,
            date=today,
            youtube_subscribers=youtube_subscribers,
            youtube_total_views=youtube_total_views,
            lastfm_listeners=lastfm_listeners,
            lastfm_playcount=lastfm_playcount,
            validation_flags=validation_flags or None,
        )
        save_data(data_path, data)
        logger.info(
            f"収集完了: {name} - {result.monthly_listeners:,} listeners, "
            f"{result.followers:,} followers"
            + (f", {youtube_subscribers:,} subscribers" if youtube_subscribers else "")
            + (f" [flags: {validation_flags}]" if validation_flags else "")
        )


if __name__ == "__main__":
    try:
        collect_all()
    except Exception as e:
        logger.error(f"予期しないエラー: {e}")
        sys.exit(1)
