import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

import pytest

from collector.lastfm import LastfmError, extract_lastfm_stats, fetch_lastfm_stats


class TestExtractLastfmStats:
    def test_artist_getinfo(self):
        response = {
            "artist": {
                "name": "King Gnu",
                "stats": {"listeners": "521820", "playcount": "19180094"},
            }
        }
        stats = extract_lastfm_stats(response)
        assert stats.listeners == 521820
        assert stats.playcount == 19180094

    def test_top_countries_compat(self):
        response = {
            "topcountries": {
                "country": [
                    {"name": "Japan", "listeners": "50000"},
                ],
                "@attr": {"artist": "King Gnu"},
            }
        }
        stats = extract_lastfm_stats(response)
        assert stats.top_countries is not None
        assert len(stats.top_countries) == 1
        assert stats.top_countries[0]["country"] == "Japan"

    def test_error_response(self):
        response = {"error": 6, "message": "Artist not found"}
        with pytest.raises(LastfmError):
            extract_lastfm_stats(response)

    def test_empty_response(self):
        stats = extract_lastfm_stats({})
        assert stats.listeners == 0
        assert stats.playcount == 0


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
            "artist": {
                "name": "King Gnu",
                "stats": {"listeners": "521820", "playcount": "19180094"},
            }
        }
        stats = fetch_lastfm_stats("King Gnu", api_key="test", base_url=url)
        assert stats.listeners == 521820
        assert stats.playcount == 19180094

    def test_error(self, stub_lastfm):
        url, handler = stub_lastfm
        handler.response_body = {"error": 6, "message": "Artist not found"}
        with pytest.raises(LastfmError):
            fetch_lastfm_stats("Unknown", api_key="test", base_url=url)
