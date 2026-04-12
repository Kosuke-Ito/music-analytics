"""YouTube Music 収集モジュール

ytmusicapi (unofficial) を薄くラップして、必要な情報のみ取得する。
認証なしで動作（YouTube Music の有料サブスク不要）。

データ取得対象:
- アーティスト名 / channel_id
- subscribers (登録者数、丸め値)
- monthlyListeners (YouTube Music 月間リスナー、Spotify monthly_listeners 相当)
- total_views (累計再生回数)

依存: ytmusicapi (MIT License, github.com/sigma67/ytmusicapi)
"""
from dataclasses import dataclass
import re

# 数値パース用のサフィックス倍率
_SUFFIXES = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}


class YouTubeMusicError(Exception):
    """YouTube Music 関連のエラー"""


@dataclass
class RelatedArtist:
    name: str
    browse_id: str
    subscribers: str  # 丸め値のまま保持（"1.94M"等）

    def to_dict(self) -> dict:
        return {"name": self.name, "browse_id": self.browse_id, "subscribers": self.subscribers}


@dataclass
class YouTubeMusicStats:
    name: str
    channel_id: str
    subscribers: int
    monthly_listeners: int
    total_views: int
    related_artists: list[RelatedArtist]
    description: str = ""
    top_songs: list[dict] | None = None


def parse_count(value: str | None) -> int:
    """ "7.39M" / "1.2K" / "6,518,365,811 views" のような文字列を整数に変換する。

    解析失敗時は 0 を返す（例外を投げない、null安全）。
    """
    if not value:
        return 0

    # "1,234,567" or "6,518,365,811 views" のような数字+カンマ形式
    cleaned = value.strip().replace("views", "").strip()
    if "," in cleaned and not cleaned.endswith(("K", "M", "B")):
        try:
            return int(cleaned.replace(",", ""))
        except ValueError:
            return 0

    # "7.39M" or "1.5B" 形式
    m = re.match(r"^([\d.]+)\s*([KMB])$", cleaned, re.IGNORECASE)
    if m:
        try:
            num = float(m.group(1))
            suffix = m.group(2).upper()
            return int(num * _SUFFIXES[suffix])
        except (ValueError, KeyError):
            return 0

    # 純粋な数字 "123"
    try:
        return int(cleaned)
    except ValueError:
        return 0


def extract_youtube_music_stats(response: dict) -> YouTubeMusicStats:
    """ytmusicapi.get_artist() のレスポンスから全フィールドを抽出する。"""
    if not response or "name" not in response:
        raise YouTubeMusicError(f"無効な YouTube Music レスポンス: {response}")

    # related artists
    related = []
    for r in response.get("related", {}).get("results", []):
        related.append(RelatedArtist(
            name=r.get("title", ""),
            browse_id=r.get("browseId", ""),
            subscribers=r.get("subscribers", ""),
        ))

    # top songs
    top_songs = None
    songs_data = response.get("songs", {}).get("results", [])
    if songs_data:
        top_songs = [
            {"title": s.get("title", ""), "video_id": s.get("videoId", "")}
            for s in songs_data[:10]
        ]

    return YouTubeMusicStats(
        name=response.get("name", ""),
        channel_id=response.get("channelId", ""),
        subscribers=parse_count(response.get("subscribers")),
        monthly_listeners=parse_count(response.get("monthlyListeners")),
        total_views=parse_count(response.get("views")),
        related_artists=related,
        description=response.get("description", ""),
        top_songs=top_songs,
    )


def fetch_youtube_music_stats(artist_name: str) -> YouTubeMusicStats:
    """YouTube Music からアーティスト情報を取得する。

    Args:
        artist_name: 検索クエリ（アーティスト名）

    Returns:
        YouTubeMusicStats

    Raises:
        YouTubeMusicError: 検索ヒットなし or データ取得失敗
    """
    # ytmusicapi の import はここで遅延（テストのモック容易化 + 起動高速化）
    from ytmusicapi import YTMusic

    yt = YTMusic()

    try:
        results = yt.search(artist_name, filter="artists", limit=1)
    except Exception as e:
        raise YouTubeMusicError(f"検索失敗: {artist_name} - {e}") from e

    if not results:
        raise YouTubeMusicError(f"アーティストが見つかりません: {artist_name}")

    browse_id = results[0].get("browseId")
    if not browse_id:
        raise YouTubeMusicError(f"browseId が取得できません: {artist_name}")

    try:
        artist_data = yt.get_artist(browse_id)
    except Exception as e:
        raise YouTubeMusicError(f"アーティスト情報取得失敗: {artist_name} - {e}") from e

    return extract_youtube_music_stats(artist_data)
