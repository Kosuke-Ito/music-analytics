import json
import logging
from pathlib import Path

from collector.scraper import ScrapingResult

logger = logging.getLogger(__name__)


def load_data(path: Path, artist_id: str, artist_name: str) -> dict:
    """JSONファイルからアーティストデータを読み込む。ファイルが無ければ新規構造を返す。"""
    if path.exists():
        return json.loads(path.read_text())

    return {
        "artist_id": artist_id,
        "artist_name": artist_name,
        "records": [],
    }


def save_data(path: Path, data: dict) -> None:
    """アーティストデータをJSONファイルに書き込む。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def add_record(data: dict, result: ScrapingResult, date: str) -> dict:
    """レコードを追加する。同日のレコードが既にある場合はスキップ。"""
    existing_dates = {r["date"] for r in data["records"]}
    if date in existing_dates:
        logger.info(f"{date} のレコードは既に存在します。スキップします。")
        return data

    record = {
        "date": date,
        "monthly_listeners": result.monthly_listeners,
        "collected_at": result.collected_at.isoformat(),
    }
    data["records"].append(record)
    return data


def validate_record(monthly_listeners: int, previous_listeners: int | None) -> bool:
    """レコードの妥当性を検証する。"""
    if monthly_listeners <= 0:
        logger.warning(f"リスナー数が0以下です: {monthly_listeners}")
        return False

    if previous_listeners is not None and previous_listeners > 0:
        change_ratio = abs(monthly_listeners - previous_listeners) / previous_listeners
        if change_ratio > 0.5:
            logger.warning(
                f"リスナー数の変動が50%を超えています: {previous_listeners} → {monthly_listeners} ({change_ratio:.1%})"
            )
            return False

    return True
