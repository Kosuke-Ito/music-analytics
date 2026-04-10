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
