import pytest


@pytest.fixture
def artist_page_html():
    """Spotifyアーティストページの月間リスナー部分を含むスタブHTML"""
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <div>
            <span>234,567 monthly listeners</span>
        </div>
    </body>
    </html>
    """


@pytest.fixture
def artist_page_html_millions():
    """100万超のリスナー数を含むスタブHTML"""
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <div>
            <span>1,234,567 monthly listeners</span>
        </div>
    </body>
    </html>
    """


@pytest.fixture
def artist_page_html_no_listeners():
    """月間リスナー情報がないページのスタブHTML"""
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <div>Some other content</div>
    </body>
    </html>
    """
