// /api/* のみ Basic 認証で保護する（ダッシュボード本体は公開）。
// add-artist 等はリポジトリへの書き込みを伴うため、
// 認証情報が未設定の場合は素通りさせず fail-closed で拒否する。
export async function onRequest(context) {
  const { request, env } = context;

  const user = env.BASIC_AUTH_USER;
  const pass = env.BASIC_AUTH_PASS;

  if (!user || !pass) {
    return new Response("API credentials are not configured", { status: 503 });
  }

  const auth = request.headers.get("Authorization");

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [u, p] = decoded.split(":");
      if (u === user && p === pass) {
        return context.next();
      }
    }
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Artist Analytics API"',
    },
  });
}
