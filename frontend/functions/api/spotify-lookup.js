export async function onRequestGet(context) {
  const { request } = context;

  const url = new URL(request.url);
  const artistId = url.searchParams.get("id");

  if (!artistId) {
    return Response.json({ error: "id parameter required" }, { status: 400 });
  }

  // Spotify の匿名アクセストークンを取得
  const tokenResp = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!tokenResp.ok) {
    return Response.json({ error: "Failed to get Spotify token" }, { status: 502 });
  }

  const tokenData = await tokenResp.json();
  const accessToken = tokenData.accessToken;

  if (!accessToken) {
    return Response.json({ error: "No access token" }, { status: 502 });
  }

  // Spotify Web API でアーティスト情報を取得
  const artistResp = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!artistResp.ok) {
    return Response.json({ error: "Artist not found" }, { status: 404 });
  }

  const artist = await artistResp.json();

  return Response.json({
    name: artist.name,
    id: artist.id,
    image: artist.images?.[0]?.url,
    followers: artist.followers?.total,
  });
}
