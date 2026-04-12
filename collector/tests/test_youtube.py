import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

import pytest

from collector.youtube import (
    YouTubeError,
    VideoStats,
    extract_subscriber_count,
    extract_video_stats,
    fetch_subscriber_count,
    fetch_video_stats,
)


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


class TestExtractVideoStats:
    def test_extract_multiple_videos(self):
        response = {
            "items": [
                {
                    "id": "video1",
                    "statistics": {
                        "viewCount": "654321000",
                        "likeCount": "8765432",
                        "commentCount": "123456",
                    },
                },
                {
                    "id": "video2",
                    "statistics": {
                        "viewCount": "512100000",
                        "likeCount": "6543210",
                        "commentCount": "98765",
                    },
                },
            ]
        }
        stats = extract_video_stats(response)
        assert len(stats) == 2
        assert stats[0].video_id == "video1"
        assert stats[0].view_count == 654321000
        assert stats[0].like_count == 8765432
        assert stats[0].comment_count == 123456
        assert stats[1].video_id == "video2"

    def test_empty_items(self):
        assert extract_video_stats({"items": []}) == []

    def test_missing_stats_fields(self):
        response = {
            "items": [
                {
                    "id": "video1",
                    "statistics": {"viewCount": "100"},
                }
            ]
        }
        stats = extract_video_stats(response)
        assert stats[0].view_count == 100
        assert stats[0].like_count == 0
        assert stats[0].comment_count == 0


class TestFetchVideoStats:
    def test_success(self, stub_youtube_api):
        url, handler = stub_youtube_api
        handler.response_body = {
            "items": [
                {
                    "id": "abc123",
                    "statistics": {
                        "viewCount": "1000000",
                        "likeCount": "50000",
                        "commentCount": "1000",
                    },
                }
            ]
        }
        result = fetch_video_stats(["abc123"], api_key="test-key", base_url=url)
        assert len(result) == 1
        assert result[0].video_id == "abc123"
        assert result[0].view_count == 1000000


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
