import json
import logging
from datetime import datetime, timezone
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


def add_record(
    data: dict,
    result: ScrapingResult,
    date: str,
    youtube_subscribers: int | None = None,
    youtube_total_views: int | None = None,
) -> dict:
    """レコードを追加する。同日のレコードが既にある場合はYouTubeデータをマージ。"""
    for record in data["records"]:
        if record["date"] == date:
            if youtube_subscribers is not None:
                record["youtube_subscribers"] = youtube_subscribers
            if youtube_total_views is not None:
                record["youtube_total_views"] = youtube_total_views
            if result.followers:
                record["spotify_followers"] = result.followers
            if result.top_cities:
                record["top_cities"] = result.top_cities
            logger.info(f"{date} のレコードを更新しました。")
            return data

    record = {
        "date": date,
        "monthly_listeners": result.monthly_listeners,
        "collected_at": result.collected_at.isoformat(),
    }
    if result.followers:
        record["spotify_followers"] = result.followers
    if youtube_subscribers is not None:
        record["youtube_subscribers"] = youtube_subscribers
    if youtube_total_views is not None:
        record["youtube_total_views"] = youtube_total_views
    if result.top_cities:
        record["top_cities"] = result.top_cities
    data["records"].append(record)
    return data


def add_annotation(
    data: dict,
    date: str,
    title: str,
    description: str = "",
    url: str = "",
    category: str = "other",
) -> dict:
    """アノテーションを追加する。同日+同タイトルの重複は無視。"""
    if "annotations" not in data:
        data["annotations"] = []

    for ann in data["annotations"]:
        if ann["date"] == date and ann["title"] == title:
            logger.info(f"重複アノテーション: {date} {title}")
            return data

    data["annotations"].append({
        "date": date,
        "title": title,
        "description": description,
        "url": url,
        "category": category,
        "added_at": datetime.now(timezone.utc).isoformat(),
    })
    data["annotations"].sort(key=lambda a: a["date"])
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
