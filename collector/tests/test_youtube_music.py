"""YouTube Music 収集モジュールのテスト"""
import pytest

from collector.youtube_music import (
    YouTubeMusicError,
    YouTubeMusicStats,
    parse_count,
    extract_youtube_music_stats,
)


class TestParseCount:
    """文字列形式の数値（"7.39M", "1.2K", "1,234,567 views"）のパース"""

    def test_million_decimal(self):
        assert parse_count("7.39M") == 7_390_000

    def test_million_integer(self):
        assert parse_count("3M") == 3_000_000

    def test_billion(self):
        assert parse_count("1.5B") == 1_500_000_000

    def test_thousand_decimal(self):
        assert parse_count("1.94K") == 1_940

    def test_thousand_integer(self):
        assert parse_count("500K") == 500_000

    def test_plain_number(self):
        assert parse_count("123") == 123

    def test_views_suffix(self):
        assert parse_count("6,518,365,811 views") == 6_518_365_811

    def test_comma_only(self):
        assert parse_count("1,234,567") == 1_234_567

    def test_none_returns_zero(self):
        assert parse_count(None) == 0

    def test_empty_returns_zero(self):
        assert parse_count("") == 0

    def test_invalid_returns_zero(self):
        assert parse_count("invalid") == 0


class TestExtractYouTubeMusicStats:
    """get_artist のレスポンスから必要フィールドを抽出"""

    def test_extract_basic_fields(self):
        response = {
            "name": "YOASOBI",
            "channelId": "UCvpredjG93ifbCP1Y77JyFA",
            "subscribers": "7.39M",
            "monthlyListeners": "51.3M",
            "views": "6,518,365,811 views",
        }
        stats = extract_youtube_music_stats(response)
        assert stats.name == "YOASOBI"
        assert stats.channel_id == "UCvpredjG93ifbCP1Y77JyFA"
        assert stats.subscribers == 7_390_000
        assert stats.monthly_listeners == 51_300_000
        assert stats.total_views == 6_518_365_811

    def test_missing_monthly_listeners(self):
        """monthlyListeners が無いケース（一部アーティスト）"""
        response = {
            "name": "Some Artist",
            "channelId": "UCxxxx",
            "subscribers": "100K",
            "views": "1,000,000 views",
        }
        stats = extract_youtube_music_stats(response)
        assert stats.monthly_listeners == 0

    def test_empty_response_raises(self):
        with pytest.raises(YouTubeMusicError):
            extract_youtube_music_stats({})

    def test_no_name_raises(self):
        with pytest.raises(YouTubeMusicError):
            extract_youtube_music_stats({"subscribers": "1M"})
