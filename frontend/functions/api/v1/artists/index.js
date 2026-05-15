/**
 * GET /api/artists — アーティスト一覧
 * クエリ: ?region=jp|global（省略可）
 */
export async function onRequestGet(context) {
  try {
    const resp = await context.env.ASSETS.fetch(new URL("/config.json", context.request.url));
    if (!resp.ok) {
      return Response.json({ error: "Failed to load config" }, { status: 500 });
    }
    const config = await resp.json();
    let artists = config.artists || [];

    const url = new URL(context.request.url);
    const region = url.searchParams.get("region");
    if (region) {
      artists = artists.filter((a) => a.region === region);
    }

    return Response.json({ artists, total: artists.length }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
