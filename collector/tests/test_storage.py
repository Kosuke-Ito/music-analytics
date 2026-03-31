import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from collector.scraper import ScrapingResult
from collector.storage import add_record, load_data, save_data, validate_record


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

    def test_duplicate_date_skipped(self, sample_result):
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
        updated = add_record(data, sample_result, date="2026-03-31")
        assert len(updated["records"]) == 1
        assert updated["records"][0]["monthly_listeners"] == 32000  # 更新されない


class TestValidateRecord:
    def test_positive_value_passes(self):
        assert validate_record(32400, previous_listeners=None) is True

    def test_zero_rejected(self):
        assert validate_record(0, previous_listeners=None) is False

    def test_negative_rejected(self):
        assert validate_record(-100, previous_listeners=None) is False

    def test_normal_change_passes(self):
        assert validate_record(33000, previous_listeners=32000) is True

    def test_spike_rejected(self):
        # 50%超の増加
        assert validate_record(50000, previous_listeners=32000) is False

    def test_drop_rejected(self):
        # 50%超の減少
        assert validate_record(15000, previous_listeners=32000) is False
