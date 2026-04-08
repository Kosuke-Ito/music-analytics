from dataclasses import dataclass

import requests

LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/"


class LastfmError(Exception):
    """Last.fm API関連のエラー"""


@dataclass
class LastfmStats:
    listeners: int = 0
    playcount: int = 0
    top_countries: list | None = None  # 廃止済みだが型互換のため残す


def extract_lastfm_stats(response: dict) -> LastfmStats:
    """Last.fm APIレスポンスからリスナー/再生データを抽出する。

    artist.getInfo または旧 artist.getTopCountries の両方に対応。
    """
    if "error" in response:
        raise LastfmError(f"Last.fm APIエラー: {response.get('message', 'unknown')}")

    # artist.getTopCountries（旧API、互換用）
    if "topcountries" in response:
        countries = []
        try:
            for c in response["topcountries"]["country"]:
                countries.append({
                    "country": c["name"],
                    "listeners": int(c["listeners"]),
                })
        except (KeyError, TypeError, ValueError):
            pass
        return LastfmStats(top_countries=countries)

    # artist.getInfo
    if "artist" in response:
        stats = response["artist"].get("stats", {})
        return LastfmStats(
            listeners=int(stats.get("listeners", "0")),
            playcount=int(stats.get("playcount", "0")),
        )

    return LastfmStats()


def fetch_lastfm_stats(
    artist_name: str,
    api_key: str,
    base_url: str = LASTFM_API_BASE,
) -> LastfmStats:
    """Last.fm APIでアーティストのリスナー・再生データを取得する。"""
    params = {
        "method": "artist.getInfo",
        "artist": artist_name,
        "api_key": api_key,
        "format": "json",
    }

    if "127.0.0.1" in base_url or "localhost" in base_url:
        resp = requests.get(base_url, params=params, timeout=10)
    else:
        resp = requests.get(base_url, params=params, timeout=10)

    resp.raise_for_status()
    data = resp.json()
    return extract_lastfm_stats(data)
