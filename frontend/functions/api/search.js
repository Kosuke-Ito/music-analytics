/**
 * GET /api/search?q=... — アーティスト名検索（前方一致 + 部分一致）
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("q");

  if (!query || query.length < 1) {
    return Response.json({ error: "q parameter required (min 1 char)" }, { status: 400 });
  }

  try {
    const resp = await context.env.ASSETS.fetch(new URL("/config.json", context.request.url));
    if (!resp.ok) {
      return Response.json({ error: "Failed to load config" }, { status: 500 });
    }
    const config = await resp.json();
    const q = query.toLowerCase();

    const results = (config.artists || []).filter((a) =>
      a.name.toLowerCase().includes(q) || a.id.includes(q),
    );

    return Response.json({ query, results, total: results.length }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
