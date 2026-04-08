export async function onRequestGet(context) {
  const { request, env } = context;

  const apiKey = env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const channelId = url.searchParams.get("id");

  if (!channelId) {
    return Response.json({ error: "id parameter required" }, { status: 400 });
  }

  const ytResp = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`,
    { headers: { "User-Agent": "music-analytics" } }
  );

  if (!ytResp.ok) {
    return Response.json({ error: "YouTube API error" }, { status: 502 });
  }

  const data = await ytResp.json();

  if (!data.items?.length) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  const channel = data.items[0];

  return Response.json({
    id: channel.id,
    title: channel.snippet?.title,
    thumbnail: channel.snippet?.thumbnails?.default?.url,
    subscribers: parseInt(channel.statistics?.subscriberCount || "0", 10),
    videoCount: parseInt(channel.statistics?.videoCount || "0", 10),
  });
}
