from dataclasses import dataclass

import requests

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeError(Exception):
    """YouTube API関連のエラー"""


@dataclass
class YouTubeStats:
    subscribers: int
    total_views: int
    video_count: int = 0


@dataclass
class VideoStats:
    video_id: str
    view_count: int
    like_count: int
    comment_count: int


def extract_subscriber_count(response: dict) -> int:
    """YouTube API レスポンスから登録者数を抽出する。"""
    items = response.get("items")
    if not items:
        raise YouTubeError(f"チャンネルが見つかりません: {response}")

    stats = items[0].get("statistics", {})

    if stats.get("hiddenSubscriberCount"):
        raise YouTubeError("登録者数が非公開です")

    count_str = stats.get("subscriberCount", "0")
    return int(count_str)


def extract_youtube_stats(response: dict) -> YouTubeStats:
    """YouTube API レスポンスから登録者数と総再生回数を抽出する。"""
    items = response.get("items")
    if not items:
        raise YouTubeError(f"チャンネルが見つかりません: {response}")

    stats = items[0].get("statistics", {})

    if stats.get("hiddenSubscriberCount"):
        raise YouTubeError("登録者数が非公開です")

    return YouTubeStats(
        subscribers=int(stats.get("subscriberCount", "0")),
        total_views=int(stats.get("viewCount", "0")),
        video_count=int(stats.get("videoCount", "0")),
    )


def fetch_youtube_stats(
    channel_id: str,
    api_key: str,
    base_url: str = YOUTUBE_API_BASE,
) -> YouTubeStats:
    """YouTube Data API v3 でチャンネルの統計を取得する。"""
    url = f"{base_url}/channels"
    params = {
        "part": "statistics",
        "id": channel_id,
        "key": api_key,
    }

    if "127.0.0.1" in base_url or "localhost" in base_url:
        resp = requests.get(base_url, params=params, timeout=10)
    else:
        resp = requests.get(url, params=params, timeout=10)

    resp.raise_for_status()
    data = resp.json()
    return extract_youtube_stats(data)


def extract_video_stats(response: dict) -> list[VideoStats]:
    """YouTube API レスポンスから動画統計を抽出する。"""
    items = response.get("items", [])
    results = []
    for item in items:
        stats = item.get("statistics", {})
        results.append(VideoStats(
            video_id=item.get("id", ""),
            view_count=int(stats.get("viewCount", "0")),
            like_count=int(stats.get("likeCount", "0")),
            comment_count=int(stats.get("commentCount", "0")),
        ))
    return results


def fetch_video_stats(
    video_ids: list[str],
    api_key: str,
    base_url: str = YOUTUBE_API_BASE,
) -> list[VideoStats]:
    """YouTube Data API v3 で複数動画の統計を一括取得する。"""
    if not video_ids:
        return []

    url = f"{base_url}/videos"
    params = {
        "part": "statistics",
        "id": ",".join(video_ids[:50]),
        "key": api_key,
    }

    if "127.0.0.1" in base_url or "localhost" in base_url:
        resp = requests.get(base_url, params=params, timeout=10)
    else:
        resp = requests.get(url, params=params, timeout=10)

    resp.raise_for_status()
    data = resp.json()
    return extract_video_stats(data)


# 後方互換
def fetch_subscriber_count(
    channel_id: str,
    api_key: str,
    base_url: str = YOUTUBE_API_BASE,
) -> int:
    return fetch_youtube_stats(channel_id, api_key, base_url).subscribers
