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
// 厳密な制限が必要になったら独自ドメイン移行 + WAF Rate Limiting Rules が第一候補。
export function createRateLimiter({ windowMs, maxFailures, maxKeys = 10_000 }) {
  const failures = new Map(); // key -> ウィンドウ内の失敗時刻の配列

  // キー数が上限を超えたら期限切れキーを全掃除する。
  // それでも超過する（全キーがアクティブ）なら clear して制限を一時的に諦める
  // （fail-open）。制限機構自体がメモリ枯渇の経路になるのを防ぐ最終防衛。
  function sweep(now) {
    if (failures.size <= maxKeys) return;
    for (const [key, list] of failures) {
      if (list.every((t) => now - t >= windowMs)) failures.delete(key);
    }
    if (failures.size > maxKeys) failures.clear();
  }

  // 期限切れの失敗を落とした配列を返す。Map への書き戻し（副作用）あり
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
      sweep(now);
      return prune(key, now).length >= maxFailures;
    },
    recordFailure(key, now) {
      sweep(now);
      failures.set(key, [...prune(key, now), now]);
    },
    size() {
      return failures.size;
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

  // CF-Connecting-IP は Cloudflare のエッジが必ず付与する（クライアント偽装は上書きされる）。
  // 欠落はローカル実行等のみで、識別子が無いときに制限すると全員が同一バケツに
  // 入ってしまうため、制限をスキップする（レート制限は可用性側の機構なので fail-open）
  const ip = request.headers.get("CF-Connecting-IP");
  const now = Date.now();

  // 制限中は認証処理より前に弾く（正しい資格情報でもロックアウトする）
  if (ip && limiter.isLimited(ip, now)) {
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

  // 資格情報を提示したうえで失敗した場合のみ数える。ヘッダー無しは
  // Basic 認証の正常なハンドシェイク（401 を受けてから再送する）なので数えない
  if (ip && auth) limiter.recordFailure(ip, now);

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Artist Analytics API"',
    },
  });
}
