/**
 * GET /api/artists/:id — 単一アーティストの全データ
 * パス: /api/artists/yoasobi
 */
export async function onRequestGet(context) {
  const id = context.params.id;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return Response.json({ error: "Invalid artist ID" }, { status: 400 });
  }

  try {
    const resp = await context.env.ASSETS.fetch(new URL(`/data/${id}.json`, context.request.url));
    if (!resp.ok) {
      return Response.json({ error: `Artist '${id}' not found` }, { status: 404 });
    }
    const data = await resp.json();
    return Response.json(data, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
