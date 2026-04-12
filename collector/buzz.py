"""バズ（小さなスパイク）自動検知モジュール

日次収集後のレコードを分析し、通常パターンから逸脱した上昇を検出する。
検出されたバズは buzz_events として記録され、以下の3種類に分類される:
- annotated: 施策（アノテーション）に紐付くバズ → 効果測定
- organic: アノテーションなし → UGC/TikTok等の偶発バズ（最重要の発見）
- seasonal: 過去同時期にも同様のバズ → 季節パターン
"""
import logging
import statistics
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# 検知パラメータ
MIN_HISTORY = 7  # 統計計算に必要な最低日数
LOOKBACK_DAYS = 30  # 移動平均の計算期間
BUZZ_THRESHOLD = 2.0  # この倍数のσを超えたらバズ
ANNOTATION_WINDOW = 3  # 前後N日以内のアノテーションと紐付け
SEASONAL_WINDOW = 14  # ±N日に過去バズがあれば季節判定

# 検知対象の指標
BUZZ_METRICS = [
    "monthly_listeners",
    "ytm_monthly_listeners",
    "youtube_total_views",
]


@dataclass
class BuzzEvent:
    date: str
    metric: str
    value: int
    baseline_mean: float
    baseline_stddev: float
    delta: int
    score: float
    type: str  # "annotated" | "organic" | "seasonal"
    related_annotation: str | None
    detected_at: str

    def to_dict(self) -> dict:
        return asdict(self)


def detect_buzz_for_metric(
    values: list[int],
    current: int,
    threshold: float = BUZZ_THRESHOLD,
) -> float | None:
    """単一指標のバズスコアを算出する。

    過去の値の移動平均と標準偏差から、当日値の異常度を計算。
    上昇方向のみ検知（下落はバズではない）。

    Args:
        values: 過去N日間の値（当日を含まない）
        current: 当日の値
        threshold: バズ判定閾値（σの倍数）

    Returns:
        score (float) バズ検知時、None バズなし
    """
    # 0以下を除外
    valid = [v for v in values if v > 0]

    if len(valid) < MIN_HISTORY:
        return None

    mean = statistics.mean(valid)
    stddev = statistics.pstdev(valid)

    if mean == 0:
        return None

    # stddev=0（全値一定）の場合、平均の1%を最小偏差として使用
    effective_stddev = stddev if stddev > 0 else mean * 0.01

    score = (current - mean) / effective_stddev

    if score < threshold:
        return None

    return round(score, 2)


def classify_buzz_type(
    buzz_date: str,
    annotations: list[dict],
    past_buzz_events: list[dict],
    annotation_window: int = ANNOTATION_WINDOW,
    seasonal_window: int = SEASONAL_WINDOW,
) -> dict:
    """バズを施策連動/自然発生/季節パターンに分類する。

    Returns:
        {"type": "annotated"|"organic"|"seasonal", "related_annotation": str|None}
    """
    buzz_dt = datetime.strptime(buzz_date, "%Y-%m-%d")

    # 1. 前後N日にアノテーションがあるか
    for ann in annotations:
        try:
            ann_dt = datetime.strptime(ann["date"], "%Y-%m-%d")
        except (ValueError, KeyError):
            continue
        diff = abs((buzz_dt - ann_dt).days)
        if diff <= annotation_window:
            return {"type": "annotated", "related_annotation": ann.get("title")}

    # 2. 過去の同時期（昨年の同時期±N日）にバズがあるか
    for past in past_buzz_events:
        try:
            past_dt = datetime.strptime(past["date"], "%Y-%m-%d")
        except (ValueError, KeyError):
            continue
        # 同年は除外（昨年以前のみ）
        if past_dt.year >= buzz_dt.year:
            continue
        # 月日を比較（年をまたいで同時期か）
        past_same_year = past_dt.replace(year=buzz_dt.year)
        diff = abs((buzz_dt - past_same_year).days)
        if diff <= seasonal_window:
            return {"type": "seasonal", "related_annotation": None}

    # 3. いずれにも該当しない → 自然発生
    return {"type": "organic", "related_annotation": None}


def detect_buzz_events(
    records: list[dict],
    annotations: list[dict],
    past_buzz_events: list[dict],
) -> list[BuzzEvent]:
    """レコード配列の最新日のバズを検出する。

    最新レコードの各指標について、過去 LOOKBACK_DAYS 日間の傾向と比較し、
    閾値を超えた上昇があればバズイベントとして返す。

    Args:
        records: 日次レコード（日付順、最新が末尾）
        annotations: アノテーション配列
        past_buzz_events: 過去に検出されたバズイベント

    Returns:
        新規検出されたバズイベントのリスト
    """
    if len(records) < MIN_HISTORY + 1:
        return []

    current_record = records[-1]
    current_date = current_record["date"]
    history = records[-(LOOKBACK_DAYS + 1):-1]  # 当日を除く直近N日

    events: list[BuzzEvent] = []
    now = datetime.now(timezone.utc).isoformat()

    for metric in BUZZ_METRICS:
        current_value = current_record.get(metric)
        if current_value is None or not isinstance(current_value, (int, float)):
            continue

        history_values = [
            r[metric]
            for r in history
            if metric in r and isinstance(r.get(metric), (int, float))
        ]

        score = detect_buzz_for_metric(history_values, int(current_value))
        if score is None:
            continue

        mean = statistics.mean([v for v in history_values if v > 0])
        stddev = statistics.pstdev([v for v in history_values if v > 0])

        classification = classify_buzz_type(
            current_date, annotations, past_buzz_events,
        )

        events.append(BuzzEvent(
            date=current_date,
            metric=metric,
            value=int(current_value),
            baseline_mean=round(mean, 1),
            baseline_stddev=round(stddev, 1),
            delta=int(current_value - mean),
            score=score,
            type=classification["type"],
            related_annotation=classification["related_annotation"],
            detected_at=now,
        ))

    return events
