import json

import pytest

from collector.main import filter_artists, parse_args


@pytest.fixture
def sample_artists():
    return [
        {"id": "king-gnu", "name": "King Gnu", "spotify_artist_id": "aaa"},
        {"id": "qnel", "name": "Qnel", "spotify_artist_id": "bbb"},
        {"id": "yoasobi", "name": "YOASOBI", "spotify_artist_id": "ccc"},
    ]


class TestFilterArtists:
    def test_returns_all_when_artist_id_is_none(self, sample_artists):
        result = filter_artists(sample_artists, artist_id=None)
        assert result == sample_artists

    def test_returns_single_artist_when_id_matches(self, sample_artists):
        result = filter_artists(sample_artists, artist_id="qnel")
        assert len(result) == 1
        assert result[0]["id"] == "qnel"

    def test_returns_empty_when_id_not_found(self, sample_artists):
        result = filter_artists(sample_artists, artist_id="unknown")
        assert result == []

    def test_empty_string_treated_as_none(self, sample_artists):
        # argparse 未指定時に空文字になるケースへのガード
        result = filter_artists(sample_artists, artist_id="")
        assert result == sample_artists


class TestParseArgs:
    def test_no_args_returns_none_artist_id(self):
        args = parse_args([])
        assert args.artist_id is None

    def test_artist_id_flag(self):
        args = parse_args(["--artist-id", "qnel"])
        assert args.artist_id == "qnel"


class TestCollectAllJsonError:
    """壊れたJSONファイルがあっても他のアーティストの収集を続行する"""

    def test_broken_json_skips_artist_and_continues(self, tmp_path, monkeypatch):
        from unittest.mock import patch
        from datetime import datetime, timezone
        from collector.scraper import ScrapingResult

        # config with 2 artists
        config = {
            "artists": [
                {"id": "broken-artist", "name": "Broken", "spotify_artist_id": "sp1"},
                {"id": "good-artist", "name": "Good", "spotify_artist_id": "sp2"},
            ]
        }
        config_path = tmp_path / "config.json"
        config_path.write_text(json.dumps(config))

        data_dir = tmp_path / "data"
        data_dir.mkdir()

        # broken JSON for first artist
        (data_dir / "broken-artist.json").write_text('{"records": [} INVALID')

        # valid JSON for second artist
        good_data = {"artist_id": "sp2", "artist_name": "Good", "records": []}
        (data_dir / "good-artist.json").write_text(json.dumps(good_data))

        # Patch module-level constants and scraper
        import collector.main as main_mod
        monkeypatch.setattr(main_mod, "CONFIG_PATH", config_path)
        monkeypatch.setattr(main_mod, "DATA_DIR", data_dir)

        fake_result = ScrapingResult(
            monthly_listeners=10000,
            collected_at=datetime(2026, 4, 25, 0, 0, tzinfo=timezone.utc),
        )

        with patch.object(main_mod, "scrape_monthly_listeners_with_retry", return_value=fake_result):
            # Should NOT raise - broken artist is skipped
            main_mod.collect_all()

        # good-artist should have been collected
        good_saved = json.loads((data_dir / "good-artist.json").read_text())
        assert len(good_saved["records"]) == 1
