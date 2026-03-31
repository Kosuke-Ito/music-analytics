import json
from dataclasses import dataclass
from datetime import datetime, timezone


class ScrapingError(Exception):
    """スクレイピングに失敗した場合の例外"""


@dataclass
class ScrapingResult:
    monthly_listeners: int
    collected_at: datetime


def extract_monthly_listeners(api_response: dict) -> int:
    """Spotify partner APIレスポンスからmonthlyListenersを抽出する。

    レスポンス例: {"data": {"artistUnion": {"stats": {"monthlyListeners": 28970, ...}}}}
    """
    try:
        listeners = api_response["data"]["artistUnion"]["stats"]["monthlyListeners"]
    except (KeyError, TypeError):
        raise ScrapingError(
            f"monthlyListenersが見つかりません: {json.dumps(api_response)[:200]}"
        )

    if not isinstance(listeners, int) or listeners < 0:
        raise ScrapingError(f"不正なリスナー数: {listeners}")

    return listeners


def scrape_from_url(url: str, timeout: int = 30_000) -> ScrapingResult:
    """指定URLにPlaywrightでアクセスし、APIレスポンスからリスナー数を取得する。"""
    from playwright.sync_api import sync_playwright

    monthly_listeners = None

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
            nonlocal monthly_listeners
            if monthly_listeners is not None:
                return
            if "api-partner" not in response.url:
                return
            try:
                body = response.json()
                text = json.dumps(body)
                if "artistUnion" in text and "monthlyListeners" in text:
                    monthly_listeners = extract_monthly_listeners(body)
            except Exception:
                pass

        page.on("response", on_response)

        try:
            # トップページでセッション確立
            page.goto("https://open.spotify.com", wait_until="networkidle", timeout=timeout)
            # アーティストページに遷移
            page.goto(url, wait_until="networkidle", timeout=timeout)
            page.wait_for_timeout(5000)
        except Exception as e:
            raise ScrapingError(f"ページ読み込み失敗: {e}") from e
        finally:
            browser.close()

    if monthly_listeners is None:
        raise ScrapingError("APIレスポンスからリスナー数を取得できませんでした")

    return ScrapingResult(
        monthly_listeners=monthly_listeners,
        collected_at=datetime.now(timezone.utc),
    )


def scrape_monthly_listeners(artist_id: str) -> ScrapingResult:
    """SpotifyアーティストIDから月間リスナー数を取得する。"""
    url = f"https://open.spotify.com/artist/{artist_id}"
    return scrape_from_url(url)
