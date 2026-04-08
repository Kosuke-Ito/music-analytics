export async function onRequestPost(context) {
  const { request, env } = context;

  const token = env.GITHUB_TOKEN;
  if (!token) {
    return Response.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, spotify_url, youtube_url, region } = body;

  if (!name || !spotify_url || !region) {
    return Response.json({ error: "name, spotify_url, region are required" }, { status: 400 });
  }

  const spotifyMatch = spotify_url.match(/artist\/([a-zA-Z0-9]+)/);
  if (!spotifyMatch) {
    return Response.json({ error: "Invalid Spotify URL" }, { status: 400 });
  }
  const spotifyId = spotifyMatch[1];

  let youtubeChannelId = "";
  if (youtube_url) {
    const ytMatch = youtube_url.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (ytMatch) youtubeChannelId = ytMatch[1];
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const owner = "Kosuke-Ito";
  const repo = "music-analytics";
  const path = "scripts/config.json";
  const apiBase = "https://api.github.com";
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "music-analytics",
  };

  // config.jsonを取得
  const getResp = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/${path}`, { headers });
  if (!getResp.ok) {
    const errBody = await getResp.text();
    return Response.json({ error: "Failed to read config.json", status: getResp.status, detail: errBody }, { status: 500 });
  }
  const fileData = await getResp.json();
  const currentContent = JSON.parse(atob(fileData.content));

  // 重複チェック
  if (currentContent.artists.some((a) => a.id === id || a.spotify_artist_id === spotifyId)) {
    return Response.json({ error: "Artist already exists" }, { status: 409 });
  }

  // 新アーティスト追加
  const newArtist = { id, name, spotify_artist_id: spotifyId, region };
  if (youtubeChannelId) newArtist.youtube_channel_id = youtubeChannelId;

  // リージョン順に挿入
  const insertIdx = region === "jp"
    ? currentContent.artists.findIndex((a) => a.region === "global")
    : currentContent.artists.length;
  if (insertIdx === -1) {
    currentContent.artists.push(newArtist);
  } else {
    currentContent.artists.splice(insertIdx, 0, newArtist);
  }

  // 直接mainにコミット
  const updatedContent = btoa(unescape(encodeURIComponent(
    JSON.stringify(currentContent, null, 2) + "\n"
  )));

  const putResp = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `feat: add ${name} via web form`,
      content: updatedContent,
      sha: fileData.sha,
    }),
  });

  if (!putResp.ok) {
    const err = await putResp.text();
    return Response.json({ error: "Failed to update config.json", detail: err }, { status: 500 });
  }

  return Response.json({ success: true, artist: newArtist });
}
