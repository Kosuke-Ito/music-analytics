import json
import logging
import statistics
from datetime import datetime, timezone
from pathlib import Path

from collector.scraper import ScrapingResult

logger = logging.getLogger(__name__)

# 履歴ベースの異常検知の設定
HISTORY_MIN_SAMPLES = 7  # 統計計算に必要な最低件数
DEVIATION_THRESHOLD_STDDEV = 5.0  # 偏差がこの倍数の標準偏差を超えたら異常
DEVIATION_THRESHOLD_PCT = 0.30  # 平均からこの%以上離れたら異常（stddev 0 対応）


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


def _merge_validation_flags(record: dict, new_flags: list[str] | None) -> None:
    if not new_flags:
        return
    existing = list(record.get("validation_flags") or [])
    merged = list(dict.fromkeys(existing + new_flags))
    if merged:
        record["validation_flags"] = merged


def add_record(
    data: dict,
    result: ScrapingResult,
    date: str,
    youtube_subscribers: int | None = None,
    youtube_total_views: int | None = None,
    lastfm_listeners: int | None = None,
    lastfm_playcount: int | None = None,
    validation_flags: list[str] | None = None,
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
            if lastfm_listeners is not None:
                record["lastfm_listeners"] = lastfm_listeners
            if lastfm_playcount is not None:
                record["lastfm_playcount"] = lastfm_playcount
            _merge_validation_flags(record, validation_flags)
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
    if lastfm_listeners is not None:
        record["lastfm_listeners"] = lastfm_listeners
    if lastfm_playcount is not None:
        record["lastfm_playcount"] = lastfm_playcount
    if validation_flags:
        record["validation_flags"] = list(dict.fromkeys(validation_flags))
    data["records"].append(record)
    return data


def add_annotation(
    data: dict,
    date: str,
    title: str,
    description: str = "",
    url: str = "",
    category: str = "other",
    source: str = "",
    confidence: str | None = None,
    verified: bool = False,
) -> dict:
    """アノテーションを追加する。同日+同タイトルの重複は無視。"""
    if "annotations" not in data:
        data["annotations"] = []

    for ann in data["annotations"]:
        if ann["date"] == date and ann["title"] == title:
            logger.info(f"重複アノテーション: {date} {title}")
            return data

    entry: dict = {
        "date": date,
        "title": title,
        "description": description,
        "url": url,
        "category": category,
        "added_at": datetime.now(timezone.utc).isoformat(),
    }
    if source:
        entry["source"] = source
    if confidence:
        entry["confidence"] = confidence
    if verified:
        entry["verified"] = True

    data["annotations"].append(entry)
    data["annotations"].sort(key=lambda a: a["date"])
    return data


def evaluate_monthly_listeners(
    monthly_listeners: int,
    previous_listeners: int | None,
    history: list[int] | None = None,
) -> tuple[bool, list[str]]:
    """月間リスナー値を評価する。

    Args:
        monthly_listeners: 当日取得した値
        previous_listeners: 直前のレコードの値
        history: 過去N日のリスナー数（最新が末尾、当日含まず）。
                 HISTORY_MIN_SAMPLES 件以上あれば偏差ベースの異常検知も実施。

    Returns:
        (保存してよいか, 付与する検証フラグ)
        0以下は保存しない。大きな変動は保存しつつフラグを付ける。
    """
    flags: list[str] = []

    if monthly_listeners <= 0:
        logger.warning(f"リスナー数が0以下です: {monthly_listeners}")
        return False, flags

    if previous_listeners is not None and previous_listeners > 0:
        change_ratio = abs(monthly_listeners - previous_listeners) / previous_listeners
        if change_ratio > 0.5:
            logger.warning(
                f"リスナー数の変動が50%を超えています（要確認として保存）: "
                f"{previous_listeners} → {monthly_listeners} ({change_ratio:.1%})"
            )
            flags.append("large_monthly_listener_delta")

    # 履歴ベースの異常検知（移動平均からの偏差）
    if history:
        valid_history = [v for v in history if v > 0]
        if len(valid_history) >= HISTORY_MIN_SAMPLES:
            mean = statistics.mean(valid_history)
            stddev = statistics.pstdev(valid_history)
            unusual = False
            if stddev > 0:
                # 通常: σベースで判定
                deviation = abs(monthly_listeners - mean)
                if deviation > stddev * DEVIATION_THRESHOLD_STDDEV:
                    unusual = True
            else:
                # σ=0（履歴が完全一致）: %ベースで判定
                if mean > 0 and abs(monthly_listeners - mean) / mean > DEVIATION_THRESHOLD_PCT:
                    unusual = True

            if unusual:
                logger.warning(
                    f"過去{len(valid_history)}日の傾向から異常な偏差を検出: "
                    f"current={monthly_listeners}, mean={mean:.0f}, stddev={stddev:.1f}"
                )
                flags.append("unusual_deviation")

    return True, flags


# 後方互換（テスト・旧コード用）
def validate_record(monthly_listeners: int, previous_listeners: int | None) -> bool:
    ok, _ = evaluate_monthly_listeners(monthly_listeners, previous_listeners)
    return ok
