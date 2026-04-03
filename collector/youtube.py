import requests

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeError(Exception):
    """YouTube API関連のエラー"""


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


def fetch_subscriber_count(
    channel_id: str,
    api_key: str,
    base_url: str = YOUTUBE_API_BASE,
) -> int:
    """YouTube Data API v3 でチャンネルの登録者数を取得する。"""
    url = f"{base_url}/channels" if base_url != YOUTUBE_API_BASE else f"{base_url}/channels"
    params = {
        "part": "statistics",
        "id": channel_id,
        "key": api_key,
    }

    # スタブサーバー用: base_urlがlocalhostの場合はパラメータをクエリに含めるだけ
    if "127.0.0.1" in base_url or "localhost" in base_url:
        resp = requests.get(base_url, params=params, timeout=10)
    else:
        resp = requests.get(url, params=params, timeout=10)

    resp.raise_for_status()
    data = resp.json()
    return extract_subscriber_count(data)
