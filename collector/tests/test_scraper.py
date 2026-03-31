import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

import pytest

from collector.scraper import ScrapingError, extract_monthly_listeners, scrape_from_url


class TestExtractMonthlyListeners:
    def test_valid_response(self):
        response = {
            "data": {
                "artistUnion": {
                    "stats": {"followers": 17924, "monthlyListeners": 28970}
                }
            }
        }
        assert extract_monthly_listeners(response) == 28970

    def test_large_number(self):
        response = {
            "data": {
                "artistUnion": {
                    "stats": {"monthlyListeners": 102188631}
                }
            }
        }
        assert extract_monthly_listeners(response) == 102188631

    def test_not_found_raises_error(self):
        response = {"data": {"artistUnion": {"__typename": "NotFound"}}}
        with pytest.raises(ScrapingError):
            extract_monthly_listeners(response)

    def test_empty_response_raises_error(self):
        with pytest.raises(ScrapingError):
            extract_monthly_listeners({})

    def test_negative_raises_error(self):
        response = {
            "data": {
                "artistUnion": {
                    "stats": {"monthlyListeners": -1}
                }
            }
        }
        with pytest.raises(ScrapingError):
            extract_monthly_listeners(response)


class _StubHandler(BaseHTTPRequestHandler):
    """テスト用HTTPハンドラ。api_responseクラス変数でAPIレスポンスを制御。"""

    api_response: dict = {}

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        # Spotifyのアーティストページを模倣するHTML
        # JSでfetchを実行し、api-partner レスポンスを返すスタブ
        html = f"""
        <!DOCTYPE html>
        <html><body>
        <script>
        // テスト用：api-partnerエンドポイントへのfetchをシミュレート
        fetch('/api-partner/v2/query', {{method: 'POST'}});
        </script>
        </body></html>
        """
        self.wfile.write(html.encode())

    def do_POST(self):
        if "/api-partner" in self.path:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(self.api_response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass


@pytest.fixture
def stub_server():
    """スタブHTTPサーバーを起動し、URLを返すfixture"""
    server = HTTPServer(("127.0.0.1", 0), _StubHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    yield f"http://127.0.0.1:{port}", _StubHandler
    server.shutdown()
