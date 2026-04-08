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
  const baseBranch = "main";
  const newBranch = `add-artist/${id}`;
  const apiBase = "https://api.github.com";
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  // 1. 現在のconfig.jsonを取得
  const getResp = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/${path}`, { headers });
  if (!getResp.ok) {
    return Response.json({ error: "Failed to read config.json" }, { status: 500 });
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

  // リージョン順に挿入（jpグループの末尾 or globalグループの末尾）
  const insertIdx = region === "jp"
    ? currentContent.artists.findIndex((a) => a.region === "global")
    : currentContent.artists.length;
  if (insertIdx === -1) {
    currentContent.artists.push(newArtist);
  } else {
    currentContent.artists.splice(insertIdx, 0, newArtist);
  }

  const updatedContent = btoa(unescape(encodeURIComponent(
    JSON.stringify(currentContent, null, 2) + "\n"
  )));

  // 2. mainのHEAD SHAを取得
  const refResp = await fetch(`${apiBase}/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers });
  if (!refResp.ok) {
    return Response.json({ error: "Failed to get main ref" }, { status: 500 });
  }
  const refData = await refResp.json();
  const baseSha = refData.object.sha;

  // 3. 新しいブランチを作成
  const createBranchResp = await fetch(`${apiBase}/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: baseSha }),
  });
  if (!createBranchResp.ok) {
    // ブランチが既に存在する場合
    const err = await createBranchResp.json();
    if (err.message?.includes("Reference already exists")) {
      return Response.json({ error: "PR branch already exists. Check pending PRs." }, { status: 409 });
    }
    return Response.json({ error: "Failed to create branch" }, { status: 500 });
  }

  // 4. 新ブランチにconfig.jsonをコミット
  const putResp = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `feat: add ${name}`,
      content: updatedContent,
      sha: fileData.sha,
      branch: newBranch,
    }),
  });

  if (!putResp.ok) {
    return Response.json({ error: "Failed to commit" }, { status: 500 });
  }

  // 5. PRを作成
  const prResp = await fetch(`${apiBase}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: `feat: add ${name}`,
      body: `## Add Artist\n- **Name**: ${name}\n- **Spotify**: ${spotifyId}\n- **YouTube**: ${youtubeChannelId || "N/A"}\n- **Region**: ${region}\n\nAdded via web form.`,
      head: newBranch,
      base: baseBranch,
    }),
  });

  if (!prResp.ok) {
    return Response.json({ error: "Failed to create PR" }, { status: 500 });
  }

  const prData = await prResp.json();

  return Response.json({
    success: true,
    artist: newArtist,
    pr_url: prData.html_url,
  });
}
