import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

from collector.scraper import ScrapingError, scrape_monthly_listeners
from collector.storage import add_record, load_data, save_data, validate_record

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "scripts" / "config.json"
DATA_DIR = PROJECT_ROOT / "data"


def collect_all() -> None:
    """config.jsonの全アーティストのデータを収集する。"""
    config = json.loads(CONFIG_PATH.read_text())
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for artist in config["artists"]:
        artist_id = artist["id"]
        spotify_id = artist["spotify_artist_id"]
        name = artist["name"]
        data_path = DATA_DIR / f"{artist_id}.json"

        logger.info(f"収集開始: {name} ({spotify_id})")

        try:
            result = scrape_monthly_listeners(spotify_id)
        except ScrapingError as e:
            logger.error(f"スクレイピング失敗: {name} - {e}")
            continue

        data = load_data(data_path, artist_id=spotify_id, artist_name=name)

        # 前日のリスナー数を取得（バリデーション用）
        previous_listeners = None
        if data["records"]:
            previous_listeners = data["records"][-1]["monthly_listeners"]

        if not validate_record(result.monthly_listeners, previous_listeners):
            logger.warning(f"バリデーション失敗: {name} - {result.monthly_listeners}")
            continue

        data = add_record(data, result, date=today)
        save_data(data_path, data)
        logger.info(f"収集完了: {name} - {result.monthly_listeners:,} monthly listeners")


if __name__ == "__main__":
    try:
        collect_all()
    except Exception as e:
        logger.error(f"予期しないエラー: {e}")
        sys.exit(1)
