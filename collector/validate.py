"""data/*.json のスキーマバリデーション

全データファイルの整合性をチェックし、問題があれば報告する。
CI やローカルで実行可能: python -m collector.validate
"""
import json
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
CONFIG_PATH = PROJECT_ROOT / "scripts" / "config.json"

REQUIRED_RECORD_FIELDS = {"date", "monthly_listeners", "collected_at"}
OPTIONAL_RECORD_FIELDS = {
    "spotify_followers", "youtube_subscribers", "youtube_total_views",
    "youtube_video_count", "top_cities", "lastfm_listeners", "lastfm_playcount",
    "ytm_subscribers", "ytm_monthly_listeners", "ytm_total_views",
    "validation_flags",
}


def validate_file(path: Path) -> list[str]:
    """1ファイルをバリデーションし、エラーメッセージのリストを返す。"""
    errors = []
    artist_id = path.stem

    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        return [f"{artist_id}: JSON パースエラー: {e}"]

    # 必須フィールド
    if "artist_id" not in data:
        errors.append(f"{artist_id}: artist_id フィールドがありません")
    if "artist_name" not in data:
        errors.append(f"{artist_id}: artist_name フィールドがありません")
    if "records" not in data or not isinstance(data["records"], list):
        errors.append(f"{artist_id}: records が無いか配列ではありません")
        return errors

    # records バリデーション
    for i, record in enumerate(data["records"]):
        for field in REQUIRED_RECORD_FIELDS:
            if field not in record:
                errors.append(f"{artist_id}: records[{i}] に {field} がありません")

        if "date" in record and not isinstance(record["date"], str):
            errors.append(f"{artist_id}: records[{i}].date が文字列ではありません")

        if "monthly_listeners" in record:
            ml = record["monthly_listeners"]
            if not isinstance(ml, (int, float)) or ml < 0:
                errors.append(f"{artist_id}: records[{i}].monthly_listeners が不正: {ml}")

    # records の日付順チェック
    dates = [r.get("date", "") for r in data["records"]]
    if dates != sorted(dates):
        errors.append(f"{artist_id}: records が日付順になっていません")

    # annotations バリデーション
    annotations = data.get("annotations", [])
    if not isinstance(annotations, list):
        errors.append(f"{artist_id}: annotations が配列ではありません")
    else:
        for i, ann in enumerate(annotations):
            if "date" not in ann:
                errors.append(f"{artist_id}: annotations[{i}] に date がありません")
            if "title" not in ann:
                errors.append(f"{artist_id}: annotations[{i}] に title がありません")

    # song_performance バリデーション
    sp = data.get("song_performance")
    if sp is not None:
        if not isinstance(sp, dict):
            errors.append(f"{artist_id}: song_performance が辞書ではありません")
        else:
            for vid, song in sp.items():
                if "title" not in song:
                    errors.append(f"{artist_id}: song_performance[{vid}] に title がありません")
                if "history" not in song or not isinstance(song.get("history"), list):
                    errors.append(f"{artist_id}: song_performance[{vid}] に history がありません")

    return errors


def validate_config() -> list[str]:
    """config.json をバリデーションする。"""
    errors = []
    try:
        config = json.loads(CONFIG_PATH.read_text())
    except json.JSONDecodeError as e:
        return [f"config.json: JSON パースエラー: {e}"]

    artists = config.get("artists", [])
    ids = set()
    for i, artist in enumerate(artists):
        if "id" not in artist:
            errors.append(f"config.json: artists[{i}] に id がありません")
            continue

        aid = artist["id"]
        if aid in ids:
            errors.append(f"config.json: id '{aid}' が重複しています")
        ids.add(aid)

        if "name" not in artist:
            errors.append(f"config.json: {aid} に name がありません")
        if "spotify_artist_id" not in artist:
            errors.append(f"config.json: {aid} に spotify_artist_id がありません")

        # データファイルの存在チェック
        data_file = DATA_DIR / f"{aid}.json"
        if not data_file.exists():
            errors.append(f"config.json: {aid} のデータファイルが存在しません: {data_file}")

    return errors


def main():
    all_errors = []

    logger.info("=== config.json バリデーション ===")
    config_errors = validate_config()
    all_errors.extend(config_errors)
    for e in config_errors:
        logger.error(e)

    logger.info(f"=== data/*.json バリデーション ({len(list(DATA_DIR.glob('*.json')))} ファイル) ===")
    for path in sorted(DATA_DIR.glob("*.json")):
        errors = validate_file(path)
        all_errors.extend(errors)
        for e in errors:
            logger.error(e)

    if all_errors:
        logger.error(f"\n❌ {len(all_errors)} 件のエラーが見つかりました")
        sys.exit(1)
    else:
        logger.info("\n✅ バリデーション完了: エラーなし")


if __name__ == "__main__":
    main()
