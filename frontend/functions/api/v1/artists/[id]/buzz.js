/**
 * GET /api/artists/:id/buzz — バズイベント
 * クエリ: ?type=organic|annotated|seasonal（省略可）
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
    let buzzEvents = data.buzz_events || [];

    const url = new URL(context.request.url);
    const type = url.searchParams.get("type");
    if (type) {
      buzzEvents = buzzEvents.filter((e) => e.type === type);
    }

    return Response.json({ artist_id: id, buzz_events: buzzEvents, total: buzzEvents.length }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
