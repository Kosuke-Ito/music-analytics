interface Env {
  BASIC_AUTH_USER: string;
  BASIC_AUTH_PASS: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

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
};
