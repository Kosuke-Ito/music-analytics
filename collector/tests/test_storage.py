import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from collector.scraper import ScrapingResult
from collector.storage import (
    add_annotation,
    add_record,
    evaluate_monthly_listeners,
    load_data,
    save_data,
    validate_record,
)


@pytest.fixture
def tmp_data_path(tmp_path):
    return tmp_path / "test_artist.json"


@pytest.fixture
def sample_result():
    return ScrapingResult(
        monthly_listeners=32400,
        collected_at=datetime(2026, 3, 31, 0, 5, 0, tzinfo=timezone.utc),
    )


class TestLoadData:
    def test_new_file_returns_empty_structure(self, tmp_data_path):
        data = load_data(tmp_data_path, artist_id="abc123", artist_name="Test Artist")
        assert data["artist_id"] == "abc123"
        assert data["artist_name"] == "Test Artist"
        assert data["records"] == []

    def test_existing_file(self, tmp_data_path):
        existing = {
            "artist_id": "abc123",
            "artist_name": "Test Artist",
            "records": [
                {
                    "date": "2026-03-30",
                    "monthly_listeners": 30000,
                    "collected_at": "2026-03-30T00:05:00+00:00",
                }
            ],
        }
        tmp_data_path.write_text(json.dumps(existing))
        data = load_data(tmp_data_path, artist_id="abc123", artist_name="Test Artist")
        assert len(data["records"]) == 1
        assert data["records"][0]["monthly_listeners"] == 30000


class TestSaveData:
    def test_writes_json(self, tmp_data_path):
        data = {
            "artist_id": "abc123",
            "artist_name": "Test Artist",
            "records": [],
        }
        save_data(tmp_data_path, data)
        assert tmp_data_path.exists()
        loaded = json.loads(tmp_data_path.read_text())
        assert loaded["artist_id"] == "abc123"


class TestAddRecord:
    def test_appends_new_record(self, sample_result):
        data = {"artist_id": "abc", "artist_name": "Test", "records": []}
        updated = add_record(data, sample_result, date="2026-03-31")
        assert len(updated["records"]) == 1
        assert updated["records"][0]["monthly_listeners"] == 32400
        assert updated["records"][0]["date"] == "2026-03-31"

    def test_duplicate_date_merges_youtube(self, sample_result):
        data = {
            "artist_id": "abc",
            "artist_name": "Test",
            "records": [
                {
                    "date": "2026-03-31",
                    "monthly_listeners": 32000,
                    "collected_at": "2026-03-31T00:00:00+00:00",
                }
            ],
        }
        updated = add_record(data, sample_result, date="2026-03-31", youtube_subscribers=5000)
        assert len(updated["records"]) == 1
        assert updated["records"][0]["monthly_listeners"] == 32000
        assert updated["records"][0]["youtube_subscribers"] == 5000

    def test_new_record_with_youtube(self, sample_result):
        data = {"artist_id": "abc", "artist_name": "Test", "records": []}
        updated = add_record(data, sample_result, date="2026-03-31", youtube_subscribers=10000)
        assert updated["records"][0]["youtube_subscribers"] == 10000

    def test_new_record_without_youtube(self, sample_result):
        data = {"artist_id": "abc", "artist_name": "Test", "records": []}
        updated = add_record(data, sample_result, date="2026-03-31")
        assert "youtube_subscribers" not in updated["records"][0]

    def test_new_record_with_validation_flags(self, sample_result):
        data = {"artist_id": "abc", "artist_name": "Test", "records": []}
        updated = add_record(
            data,
            sample_result,
            date="2026-03-31",
            validation_flags=["large_monthly_listener_delta"],
        )
        assert updated["records"][0]["validation_flags"] == ["large_monthly_listener_delta"]

    def test_merge_validation_flags_same_day(self, sample_result):
        data = {
            "artist_id": "abc",
            "artist_name": "Test",
            "records": [
                {
                    "date": "2026-03-31",
                    "monthly_listeners": 32000,
                    "collected_at": "2026-03-31T00:00:00+00:00",
                    "validation_flags": ["large_monthly_listener_delta"],
                }
            ],
        }
        updated = add_record(
            data,
            sample_result,
            date="2026-03-31",
            youtube_subscribers=5000,
            validation_flags=["large_monthly_listener_delta"],
        )
        assert updated["records"][0]["validation_flags"] == ["large_monthly_listener_delta"]


class TestAddAnnotation:
    def test_adds_to_empty(self):
        data = {"artist_id": "abc", "artist_name": "Test", "records": []}
        updated = add_annotation(data, date="2026-04-01", title="新曲リリース", category="release")
        assert len(updated["annotations"]) == 1
        assert updated["annotations"][0]["title"] == "新曲リリース"
        assert updated["annotations"][0]["category"] == "release"

    def test_optional_meta_fields(self):
        data = {"artist_id": "abc", "artist_name": "Test", "records": []}
        updated = add_annotation(
            data,
            date="2026-04-01",
            title="ニュース",
            category="other",
            source="billboard.com",
            confidence="high",
            verified=True,
        )
        ann = updated["annotations"][0]
        assert ann["source"] == "billboard.com"
        assert ann["confidence"] == "high"
        assert ann["verified"] is True

    def test_appends_to_existing(self):
        data = {
            "artist_id": "abc",
            "records": [],
            "annotations": [
                {"date": "2026-03-30", "title": "既存", "category": "other", "added_at": "..."}
            ],
        }
        updated = add_annotation(data, date="2026-04-01", title="新規", category="release")
        assert len(updated["annotations"]) == 2

    def test_duplicate_rejected(self):
        data = {
            "artist_id": "abc",
            "records": [],
            "annotations": [
                {"date": "2026-04-01", "title": "新曲リリース", "category": "release", "added_at": "..."}
            ],
        }
        updated = add_annotation(data, date="2026-04-01", title="新曲リリース", category="release")
        assert len(updated["annotations"]) == 1

    def test_sorted_by_date(self):
        data = {"artist_id": "abc", "records": []}
        data = add_annotation(data, date="2026-04-05", title="後", category="other")
        data = add_annotation(data, date="2026-04-01", title="先", category="other")
        assert data["annotations"][0]["date"] == "2026-04-01"
        assert data["annotations"][1]["date"] == "2026-04-05"


class TestEvaluateMonthlyListeners:
    def test_positive_value_ok_empty_flags(self):
        ok, flags = evaluate_monthly_listeners(32400, previous_listeners=None)
        assert ok is True
        assert flags == []

    def test_zero_rejected(self):
        ok, flags = evaluate_monthly_listeners(0, previous_listeners=None)
        assert ok is False
        assert flags == []

    def test_negative_rejected(self):
        ok, flags = evaluate_monthly_listeners(-100, previous_listeners=None)
        assert ok is False
        assert flags == []

    def test_normal_change_ok(self):
        ok, flags = evaluate_monthly_listeners(33000, previous_listeners=32000)
        assert ok is True
        assert flags == []

    def test_spike_flagged_but_ok(self):
        ok, flags = evaluate_monthly_listeners(50000, previous_listeners=32000)
        assert ok is True
        assert flags == ["large_monthly_listener_delta"]

    def test_drop_flagged_but_ok(self):
        ok, flags = evaluate_monthly_listeners(15000, previous_listeners=32000)
        assert ok is True
        assert flags == ["large_monthly_listener_delta"]


class TestValidateRecordCompat:
    def test_compat_spike_now_accepted_by_wrapper(self):
        assert validate_record(50000, previous_listeners=32000) is True

    def test_compat_zero_still_false(self):
        assert validate_record(0, previous_listeners=None) is False
