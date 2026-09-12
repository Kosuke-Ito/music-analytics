// /api/* のみ Basic 認証で保護する（ダッシュボード本体は公開）。
// add-artist 等はリポジトリへの書き込みを伴うため、
// 認証情報が未設定の場合は素通りさせず fail-closed で拒否する。

// SHA-256 ダイジェスト同士の XOR 比較で、文字列一致のタイミング差を漏らさない
// （長さの異なる入力も固定長ダイジェストになるため長さ情報も漏れない）
async function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

// 認証失敗のレート制限。isolate ごとのメモリなので厳密ではないが、
// pages.dev には WAF レート制限を設定できないため、
// ブルートフォースのコストを上げる best-effort の防御として置く。
export function createRateLimiter({ windowMs, maxFailures }) {
  const failures = new Map(); // key -> ウィンドウ内の失敗時刻の配列

  function prune(key, now) {
    const list = (failures.get(key) ?? []).filter((t) => now - t < windowMs);
    if (list.length === 0) {
      failures.delete(key);
    } else {
      failures.set(key, list);
    }
    return list;
  }

  return {
    isLimited(key, now) {
      return prune(key, now).length >= maxFailures;
    },
    recordFailure(key, now) {
      failures.set(key, [...prune(key, now), now]);
    },
  };
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_FAILURES = 5;
const limiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxFailures: RATE_LIMIT_MAX_FAILURES,
});

export async function onRequest(context) {
  const { request, env } = context;

  const user = env.BASIC_AUTH_USER;
  const pass = env.BASIC_AUTH_PASS;

  if (!user || !pass) {
    return new Response("API credentials are not configured", { status: 503 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const now = Date.now();

  // 制限中は認証処理より前に弾く（正しい資格情報でもロックアウトする）
  if (limiter.isLimited(ip, now)) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(RATE_LIMIT_WINDOW_MS / 1000) },
    });
  }

  const auth = request.headers.get("Authorization");

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      // 不正な base64 は atob が例外を投げるので、500 ではなく 401 に落とす
      let decoded = null;
      try {
        decoded = atob(encoded);
      } catch {
        decoded = null;
      }
      if (decoded !== null) {
        // "user:pass" 全体を比較する（split だとコロン入りパスワードが壊れる）
        if (await timingSafeEqual(decoded, `${user}:${pass}`)) {
          return context.next();
        }
      }
    }
  }

  limiter.recordFailure(ip, now);

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Artist Analytics API"',
    },
  });
}
