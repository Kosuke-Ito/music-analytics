"""バズ検知ロジックのテスト"""
import pytest

from collector.buzz import (
    BuzzEvent,
    classify_buzz_type,
    detect_buzz_events,
    detect_buzz_for_metric,
)


class TestDetectBuzzForMetric:
    """単一指標のバズスコア算出"""

    def test_normal_value_returns_none(self):
        values = [1000, 1010, 990, 1020, 1005, 1015, 1000, 1010, 1005, 995]
        assert detect_buzz_for_metric(values, 1015) is None

    def test_spike_returns_score(self):
        values = [1000, 1010, 990, 1020, 1005, 1015, 1000, 1010, 1005, 995]
        score = detect_buzz_for_metric(values, 1200)
        assert score is not None
        assert score > 2.0

    def test_large_spike_returns_high_score(self):
        values = [1000, 1010, 990, 1020, 1005, 1015, 1000, 1010, 1005, 995]
        score = detect_buzz_for_metric(values, 5000)
        assert score is not None
        assert score > 10.0

    def test_drop_returns_none(self):
        """下落はバズではない（上昇のみ検知）"""
        values = [1000, 1010, 990, 1020, 1005, 1015, 1000, 1010, 1005, 995]
        assert detect_buzz_for_metric(values, 500) is None

    def test_insufficient_history_returns_none(self):
        values = [1000, 1010, 990]
        assert detect_buzz_for_metric(values, 5000) is None

    def test_empty_history_returns_none(self):
        assert detect_buzz_for_metric([], 1000) is None

    def test_zero_stddev_small_change_returns_none(self):
        """全値同一（stddev=0）で微小変化はバズではない"""
        values = [1000, 1000, 1000, 1000, 1000, 1000, 1000]
        assert detect_buzz_for_metric(values, 1001) is None

    def test_zero_stddev_large_jump_detects_buzz(self):
        """全値同一でも大きなジャンプはバズ検知"""
        values = [1000, 1000, 1000, 1000, 1000, 1000, 1000]
        score = detect_buzz_for_metric(values, 5000)
        assert score is not None
        assert score > 2.0

    def test_zero_mean_returns_none(self):
        values = [0, 0, 0, 0, 0, 0, 0]
        assert detect_buzz_for_metric(values, 100) is None

    def test_negative_values_ignored(self):
        values = [1000, 1010, -1, 1020, 1005, 1015, 1000, 1010, 1005, 995]
        # -1 を含んでも動く（0以下を除外して計算）
        score = detect_buzz_for_metric(values, 1200)
        assert score is not None


class TestClassifyBuzzType:
    """バズの分類（annotated / organic / seasonal）"""

    def test_annotated_when_annotation_within_window(self):
        annotations = [
            {"date": "2026-04-10", "title": "新曲リリース", "category": "release"},
        ]
        past_events = []
        result = classify_buzz_type(
            buzz_date="2026-04-12",
            annotations=annotations,
            past_buzz_events=past_events,
            annotation_window=3,
        )
        assert result["type"] == "annotated"
        assert result["related_annotation"] == "新曲リリース"

    def test_organic_when_no_annotation(self):
        annotations = [
            {"date": "2026-03-01", "title": "古いニュース", "category": "other"},
        ]
        past_events = []
        result = classify_buzz_type(
            buzz_date="2026-04-12",
            annotations=annotations,
            past_buzz_events=past_events,
        )
        assert result["type"] == "organic"
        assert result["related_annotation"] is None

    def test_organic_when_no_annotations_at_all(self):
        result = classify_buzz_type(
            buzz_date="2026-04-12",
            annotations=[],
            past_buzz_events=[],
        )
        assert result["type"] == "organic"

    def test_seasonal_when_past_buzz_same_period(self):
        past_events = [
            {"date": "2025-04-10", "metric": "spotify_monthly_listeners"},
        ]
        result = classify_buzz_type(
            buzz_date="2026-04-12",
            annotations=[],
            past_buzz_events=past_events,
            seasonal_window=14,
        )
        assert result["type"] == "seasonal"

    def test_not_seasonal_when_past_buzz_different_period(self):
        past_events = [
            {"date": "2025-08-10", "metric": "spotify_monthly_listeners"},
        ]
        result = classify_buzz_type(
            buzz_date="2026-04-12",
            annotations=[],
            past_buzz_events=past_events,
        )
        assert result["type"] == "organic"

    def test_annotated_takes_priority_over_seasonal(self):
        """施策連動が季節パターンに優先"""
        annotations = [
            {"date": "2026-04-11", "title": "ライブ発表", "category": "tour"},
        ]
        past_events = [
            {"date": "2025-04-10", "metric": "spotify_monthly_listeners"},
        ]
        result = classify_buzz_type(
            buzz_date="2026-04-12",
            annotations=annotations,
            past_buzz_events=past_events,
        )
        assert result["type"] == "annotated"


class TestDetectBuzzEvents:
    """レコード配列からバズイベントを検出"""

    def _make_records(self, values, start_date="2026-03-01"):
        """テスト用レコード生成"""
        from datetime import datetime, timedelta

        records = []
        base = datetime.strptime(start_date, "%Y-%m-%d")
        for i, v in enumerate(values):
            d = base + timedelta(days=i)
            records.append({
                "date": d.strftime("%Y-%m-%d"),
                "monthly_listeners": v,
                "collected_at": d.isoformat(),
            })
        return records

    def test_no_buzz_in_stable_data(self):
        records = self._make_records([1000 + i for i in range(30)])
        events = detect_buzz_events(records, [], [])
        assert len(events) == 0

    def test_detects_spike_on_last_day(self):
        values = [1000] * 29 + [5000]  # 最終日にスパイク
        records = self._make_records(values)
        events = detect_buzz_events(records, [], [])
        assert len(events) >= 1
        assert events[0].metric == "monthly_listeners"
        assert events[0].score > 2.0

    def test_classifies_as_organic_without_annotation(self):
        values = [1000] * 29 + [5000]
        records = self._make_records(values)
        events = detect_buzz_events(records, [], [])
        assert events[0].type == "organic"

    def test_classifies_as_annotated_with_annotation(self):
        values = [1000] * 29 + [5000]
        records = self._make_records(values)
        annotations = [{"date": "2026-03-30", "title": "新曲", "category": "release"}]
        events = detect_buzz_events(records, annotations, [])
        assert events[0].type == "annotated"
        assert events[0].related_annotation == "新曲"

    def test_insufficient_records_returns_empty(self):
        records = self._make_records([1000, 1010, 990])
        events = detect_buzz_events(records, [], [])
        assert len(events) == 0

    def test_multiple_metrics_detected(self):
        """複数指標で同時にバズ"""
        values = [1000] * 29 + [5000]
        records = self._make_records(values)
        # ytm_monthly_listeners も追加
        for i, r in enumerate(records):
            r["ytm_monthly_listeners"] = values[i] * 10
        events = detect_buzz_events(records, [], [])
        metrics = {e.metric for e in events}
        assert "monthly_listeners" in metrics
        assert "ytm_monthly_listeners" in metrics
