export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // /api/v1/* は API 用 Basic 認証（外部連携向け）
  if (url.pathname.startsWith("/api/v1/")) {
    const apiUser = env.API_AUTH_USER;
    const apiPass = env.API_AUTH_PASS;

    if (!apiUser || !apiPass) {
      return context.next();
    }

    const auth = request.headers.get("Authorization");
    if (auth) {
      const [scheme, encoded] = auth.split(" ");
      if (scheme === "Basic" && encoded) {
        const decoded = atob(encoded);
        const [u, p] = decoded.split(":");
        if (u === apiUser && p === apiPass) {
          return Response.json
            ? context.next()
            : context.next();
        }
      }
    }

    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Music Analytics API"',
        "Content-Type": "application/json",
      },
    });
  }

  // それ以外は Web 画面用 Basic 認証（任意）
  const user = env.BASIC_AUTH_USER;
  const pass = env.BASIC_AUTH_PASS;

  if (!user || !pass) {
    return context.next();
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
      "WWW-Authenticate": 'Basic realm="Artist Analytics"',
    },
  });
}
