import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from collector.scraper import ScrapingError, scrape_monthly_listeners
from collector.storage import add_record, load_data, save_data, validate_record
from collector.youtube import YouTubeError, fetch_youtube_stats

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "scripts" / "config.json"
DATA_DIR = PROJECT_ROOT / "data"


def collect_all() -> None:
    """config.jsonの全アーティストのデータを収集する。"""
    config = json.loads(CONFIG_PATH.read_text())
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    youtube_api_key = os.environ.get("YOUTUBE_API_KEY")

    for artist in config["artists"]:
        artist_id = artist["id"]
        spotify_id = artist["spotify_artist_id"]
        youtube_channel_id = artist.get("youtube_channel_id")
        name = artist["name"]
        data_path = DATA_DIR / f"{artist_id}.json"

        # Spotify収集
        logger.info(f"Spotify収集開始: {name}")
        try:
            result = scrape_monthly_listeners(spotify_id)
        except ScrapingError as e:
            logger.error(f"Spotifyスクレイピング失敗: {name} - {e}")
            continue

        data = load_data(data_path, artist_id=spotify_id, artist_name=name)

        previous_listeners = None
        if data["records"]:
            previous_listeners = data["records"][-1]["monthly_listeners"]

        if not validate_record(result.monthly_listeners, previous_listeners):
            logger.warning(f"バリデーション失敗: {name} - {result.monthly_listeners}")
            continue

        # YouTube収集
        youtube_subscribers = None
        youtube_total_views = None
        if youtube_api_key and youtube_channel_id:
            logger.info(f"YouTube収集開始: {name}")
            try:
                yt_stats = fetch_youtube_stats(
                    youtube_channel_id, api_key=youtube_api_key
                )
                youtube_subscribers = yt_stats.subscribers
                youtube_total_views = yt_stats.total_views
                logger.info(
                    f"YouTube収集完了: {name} - {youtube_subscribers:,} subscribers, "
                    f"{youtube_total_views:,} views"
                )
            except (YouTubeError, Exception) as e:
                logger.warning(f"YouTube取得失敗: {name} - {e}")

        data = add_record(
            data, result, date=today,
            youtube_subscribers=youtube_subscribers,
            youtube_total_views=youtube_total_views,
        )
        save_data(data_path, data)
        logger.info(
            f"収集完了: {name} - {result.monthly_listeners:,} listeners, "
            f"{result.followers:,} followers"
            + (f", {youtube_subscribers:,} subscribers" if youtube_subscribers else "")
        )


if __name__ == "__main__":
    try:
        collect_all()
    except Exception as e:
        logger.error(f"予期しないエラー: {e}")
        sys.exit(1)
