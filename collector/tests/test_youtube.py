import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

import pytest

from collector.youtube import YouTubeError, extract_subscriber_count, fetch_subscriber_count


class TestExtractSubscriberCount:
    def test_valid_response(self):
        response = {
            "items": [
                {
                    "statistics": {
                        "subscriberCount": "1234567",
                        "hiddenSubscriberCount": False,
                    }
                }
            ]
        }
        assert extract_subscriber_count(response) == 1234567

    def test_hidden_subscriber_count(self):
        response = {
            "items": [
                {
                    "statistics": {
                        "subscriberCount": "0",
                        "hiddenSubscriberCount": True,
                    }
                }
            ]
        }
        with pytest.raises(YouTubeError, match="非公開"):
            extract_subscriber_count(response)

    def test_empty_items(self):
        response = {"items": []}
        with pytest.raises(YouTubeError, match="見つかりません"):
            extract_subscriber_count(response)

    def test_no_items_key(self):
        response = {"error": {"message": "API key invalid"}}
        with pytest.raises(YouTubeError):
            extract_subscriber_count(response)


class _StubYouTubeHandler(BaseHTTPRequestHandler):
    response_body: dict = {}

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(self.response_body).encode())

    def log_message(self, format, *args):
        pass


@pytest.fixture
def stub_youtube_api():
    server = HTTPServer(("127.0.0.1", 0), _StubYouTubeHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    yield f"http://127.0.0.1:{port}", _StubYouTubeHandler
    server.shutdown()


class TestFetchSubscriberCount:
    def test_success(self, stub_youtube_api):
        url, handler = stub_youtube_api
        handler.response_body = {
            "items": [
                {"statistics": {"subscriberCount": "50000", "hiddenSubscriberCount": False}}
            ]
        }
        result = fetch_subscriber_count("UC_TEST", api_key="test-key", base_url=url)
        assert result == 50000

    def test_api_error(self, stub_youtube_api):
        url, handler = stub_youtube_api
        handler.response_body = {"error": {"message": "forbidden"}}
        with pytest.raises(YouTubeError):
            fetch_subscriber_count("UC_TEST", api_key="test-key", base_url=url)
