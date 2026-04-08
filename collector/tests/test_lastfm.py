import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

import pytest

from collector.lastfm import LastfmError, extract_lastfm_stats, fetch_lastfm_stats


class TestExtractLastfmStats:
    def test_valid_response(self):
        response = {
            "topcountries": {
                "country": [
                    {"name": "Japan", "listeners": "50000"},
                    {"name": "United States", "listeners": "30000"},
                    {"name": "United Kingdom", "listeners": "10000"},
                ],
                "@attr": {"artist": "King Gnu"},
            }
        }
        stats = extract_lastfm_stats(response)
        assert len(stats.top_countries) == 3
        assert stats.top_countries[0]["country"] == "Japan"
        assert stats.top_countries[0]["listeners"] == 50000

    def test_empty_countries(self):
        response = {
            "topcountries": {
                "country": [],
                "@attr": {"artist": "Unknown"},
            }
        }
        stats = extract_lastfm_stats(response)
        assert stats.top_countries == []

    def test_error_response(self):
        response = {"error": 6, "message": "Artist not found"}
        with pytest.raises(LastfmError):
            extract_lastfm_stats(response)


class _StubLastfmHandler(BaseHTTPRequestHandler):
    response_body: dict = {}

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(self.response_body).encode())

    def log_message(self, format, *args):
        pass


@pytest.fixture
def stub_lastfm():
    server = HTTPServer(("127.0.0.1", 0), _StubLastfmHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    yield f"http://127.0.0.1:{port}", _StubLastfmHandler
    server.shutdown()


class TestFetchLastfmStats:
    def test_success(self, stub_lastfm):
        url, handler = stub_lastfm
        handler.response_body = {
            "topcountries": {
                "country": [
                    {"name": "Japan", "listeners": "50000"},
                ],
                "@attr": {"artist": "King Gnu"},
            }
        }
        stats = fetch_lastfm_stats("King Gnu", api_key="test", base_url=url)
        assert len(stats.top_countries) == 1
        assert stats.top_countries[0]["country"] == "Japan"

    def test_error(self, stub_lastfm):
        url, handler = stub_lastfm
        handler.response_body = {"error": 6, "message": "Artist not found"}
        with pytest.raises(LastfmError):
            fetch_lastfm_stats("Unknown", api_key="test", base_url=url)
