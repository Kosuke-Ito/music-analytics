from dataclasses import dataclass, field

import requests

LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/"


class LastfmError(Exception):
    """Last.fm API関連のエラー"""


@dataclass
class LastfmStats:
    top_countries: list = field(default_factory=list)


def extract_lastfm_stats(response: dict) -> LastfmStats:
    """Last.fm APIレスポンスから国別リスナーデータを抽出する。"""
    if "error" in response:
        raise LastfmError(f"Last.fm APIエラー: {response.get('message', 'unknown')}")

    countries = []
    try:
        items = response["topcountries"]["country"]
        for c in items:
            countries.append({
                "country": c["name"],
                "listeners": int(c["listeners"]),
            })
    except (KeyError, TypeError, ValueError):
        pass

    return LastfmStats(top_countries=countries)


def fetch_lastfm_stats(
    artist_name: str,
    api_key: str,
    base_url: str = LASTFM_API_BASE,
) -> LastfmStats:
    """Last.fm APIでアーティストの国別リスナーデータを取得する。"""
    params = {
        "method": "artist.getTopCountries",
        "artist": artist_name,
        "api_key": api_key,
        "format": "json",
        "limit": "10",
    }

    if "127.0.0.1" in base_url or "localhost" in base_url:
        resp = requests.get(base_url, params=params, timeout=10)
    else:
        resp = requests.get(base_url, params=params, timeout=10)

    resp.raise_for_status()
    data = resp.json()
    return extract_lastfm_stats(data)
