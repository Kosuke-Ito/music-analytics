export async function onRequestGet(context) {
  const { request, env } = context;

  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json({ error: "Spotify credentials not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const artistId = url.searchParams.get("id");

  if (!artistId) {
    return Response.json({ error: "id parameter required" }, { status: 400 });
  }

  // Client Credentials Flow でアクセストークン取得
  const tokenResp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenResp.ok) {
    return Response.json({ error: "Failed to get Spotify token" }, { status: 502 });
  }

  const tokenData = await tokenResp.json();
  const accessToken = tokenData.access_token;

  // アーティスト情報を取得
  const artistResp = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!artistResp.ok) {
    return Response.json({ error: "Artist not found" }, { status: 404 });
  }

  const artist = await artistResp.json();

  return Response.json({
    id: artist.id,
    name: artist.name,
    followers: artist.followers?.total,
    genres: artist.genres,
    popularity: artist.popularity,
    image: artist.images?.[0]?.url,
  });
}
