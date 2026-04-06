import json
from dataclasses import dataclass, field
from datetime import datetime, timezone


class ScrapingError(Exception):
    """スクレイピングに失敗した場合の例外"""


@dataclass
class ScrapingResult:
    monthly_listeners: int
    collected_at: datetime
    followers: int = 0
    top_cities: list = field(default_factory=list)


def extract_artist_stats(api_response: dict) -> dict:
    """Spotify partner APIレスポンスからstatsを抽出する。

    返り値: {"monthly_listeners": int, "top_cities": list}
    """
    try:
        stats = api_response["data"]["artistUnion"]["stats"]
        listeners = stats["monthlyListeners"]
    except (KeyError, TypeError):
        raise ScrapingError(
            f"monthlyListenersが見つかりません: {json.dumps(api_response)[:200]}"
        )

    if not isinstance(listeners, int) or listeners < 0:
        raise ScrapingError(f"不正なリスナー数: {listeners}")

    top_cities = []
    try:
        items = stats.get("topCities", {}).get("items", [])
        for city in items:
            top_cities.append({
                "city": city["city"],
                "country": city["country"],
                "listeners": city["numberOfListeners"],
            })
    except (KeyError, TypeError):
        pass

    followers = stats.get("followers", 0)

    return {"monthly_listeners": listeners, "followers": followers, "top_cities": top_cities}


# 後方互換性のため残す
def extract_monthly_listeners(api_response: dict) -> int:
    return extract_artist_stats(api_response)["monthly_listeners"]


def scrape_from_url(url: str, timeout: int = 30_000) -> ScrapingResult:
    """指定URLにPlaywrightでアクセスし、APIレスポンスからリスナー数を取得する。"""
    from playwright.sync_api import sync_playwright

    result_data = None

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/136.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 720},
            locale="en-US",
        )
        page = context.new_page()
        page.add_init_script(
            'Object.defineProperty(navigator, "webdriver", {get: () => undefined})'
        )

        def on_response(response):
            nonlocal result_data
            if result_data is not None:
                return
            if "api-partner" not in response.url:
                return
            try:
                body = response.json()
                text = json.dumps(body)
                if "artistUnion" in text and "monthlyListeners" in text:
                    result_data = extract_artist_stats(body)
            except Exception:
                pass

        page.on("response", on_response)

        try:
            page.goto("https://open.spotify.com", wait_until="networkidle", timeout=timeout)
            page.goto(url, wait_until="networkidle", timeout=timeout)
            page.wait_for_timeout(5000)
        except Exception as e:
            raise ScrapingError(f"ページ読み込み失敗: {e}") from e
        finally:
            browser.close()

    if result_data is None:
        raise ScrapingError("APIレスポンスからリスナー数を取得できませんでした")

    return ScrapingResult(
        monthly_listeners=result_data["monthly_listeners"],
        collected_at=datetime.now(timezone.utc),
        followers=result_data["followers"],
        top_cities=result_data["top_cities"],
    )


def scrape_monthly_listeners(artist_id: str) -> ScrapingResult:
    """SpotifyアーティストIDから月間リスナー数を取得する。"""
    url = f"https://open.spotify.com/artist/{artist_id}"
    return scrape_from_url(url)
