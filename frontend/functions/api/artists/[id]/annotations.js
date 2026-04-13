/**
 * GET /api/artists/:id/annotations — ニュースアノテーション
 * クエリ: ?category=release|viral|collab|tour|award|other（省略可）
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
    let annotations = data.annotations || [];

    const url = new URL(context.request.url);
    const category = url.searchParams.get("category");
    if (category) {
      annotations = annotations.filter((a) => a.category === category);
    }

    return Response.json({ artist_id: id, annotations, total: annotations.length }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
