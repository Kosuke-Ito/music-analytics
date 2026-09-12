import { describe, it, expect } from "vitest";
import { onRequest, createRateLimiter } from "../api/_middleware.js";

function makeContext({ env = {}, authHeader = null, ip = null } = {}) {
  const headers = new Headers();
  if (authHeader) headers.set("Authorization", authHeader);
  if (ip) headers.set("CF-Connecting-IP", ip);
  let nextCalled = false;
  const context = {
    request: new Request("https://example.com/api/add-artist", { headers }),
    env,
    next: () => {
      nextCalled = true;
      return new Response("ok");
    },
  };
  return { context, wasNextCalled: () => nextCalled };
}

function basicAuth(user, pass) {
  return `Basic ${btoa(`${user}:${pass}`)}`;
}

describe("functions/api/_middleware", () => {
  it("認証情報が未設定なら fail-closed で 503 を返す（素通りさせない）", async () => {
    const { context, wasNextCalled } = makeContext({ env: {} });
    const res = await onRequest(context);
    expect(res.status).toBe(503);
    expect(wasNextCalled()).toBe(false);
  });

  it("正しい資格情報なら next() を呼ぶ", async () => {
    const { context, wasNextCalled } = makeContext({
      env: { BASIC_AUTH_USER: "admin", BASIC_AUTH_PASS: "secret" },
      authHeader: basicAuth("admin", "secret"),
    });
    const res = await onRequest(context);
    expect(res.status).toBe(200);
    expect(wasNextCalled()).toBe(true);
  });

  it("誤った資格情報なら 401 を返す", async () => {
    const { context, wasNextCalled } = makeContext({
      env: { BASIC_AUTH_USER: "admin", BASIC_AUTH_PASS: "secret" },
      authHeader: basicAuth("admin", "wrong"),
    });
    const res = await onRequest(context);
    expect(res.status).toBe(401);
    expect(wasNextCalled()).toBe(false);
  });

  it("コロンを含むパスワードでも認証できる（Basic 認証仕様準拠）", async () => {
    const { context, wasNextCalled } = makeContext({
      env: { BASIC_AUTH_USER: "admin", BASIC_AUTH_PASS: "se:cr:et" },
      authHeader: basicAuth("admin", "se:cr:et"),
    });
    const res = await onRequest(context);
    expect(res.status).toBe(200);
    expect(wasNextCalled()).toBe(true);
  });

  it("パスワードの前方一致では認証されない", async () => {
    const { context, wasNextCalled } = makeContext({
      env: { BASIC_AUTH_USER: "admin", BASIC_AUTH_PASS: "secret" },
      authHeader: basicAuth("admin", "secretmore"),
    });
    const res = await onRequest(context);
    expect(res.status).toBe(401);
    expect(wasNextCalled()).toBe(false);
  });

  it("不正な base64 でも 500 にならず 401 を返す", async () => {
    const { context, wasNextCalled } = makeContext({
      env: { BASIC_AUTH_USER: "admin", BASIC_AUTH_PASS: "secret" },
      authHeader: "Basic %%%",
    });
    const res = await onRequest(context);
    expect(res.status).toBe(401);
    expect(wasNextCalled()).toBe(false);
  });

  it("Authorization ヘッダー無しなら 401 と WWW-Authenticate を返す", async () => {
    const { context } = makeContext({
      env: { BASIC_AUTH_USER: "admin", BASIC_AUTH_PASS: "secret" },
    });
    const res = await onRequest(context);
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("Basic");
  });
});

describe("createRateLimiter（純関数・時刻注入）", () => {
  it("上限未満の失敗では制限されない", () => {
    const rl = createRateLimiter({ windowMs: 60_000, maxFailures: 5 });
    for (let i = 0; i < 4; i++) rl.recordFailure("1.2.3.4", 1000 + i);
    expect(rl.isLimited("1.2.3.4", 2000)).toBe(false);
  });

  it("ウィンドウ内に上限回失敗すると制限される", () => {
    const rl = createRateLimiter({ windowMs: 60_000, maxFailures: 5 });
    for (let i = 0; i < 5; i++) rl.recordFailure("1.2.3.4", 1000 + i);
    expect(rl.isLimited("1.2.3.4", 2000)).toBe(true);
  });

  it("ウィンドウを過ぎた失敗はカウントから外れる", () => {
    const rl = createRateLimiter({ windowMs: 60_000, maxFailures: 5 });
    for (let i = 0; i < 5; i++) rl.recordFailure("1.2.3.4", 1000 + i);
    expect(rl.isLimited("1.2.3.4", 1000 + 60_000 + 10)).toBe(false);
  });

  it("別の IP は独立してカウントされる", () => {
    const rl = createRateLimiter({ windowMs: 60_000, maxFailures: 5 });
    for (let i = 0; i < 5; i++) rl.recordFailure("1.2.3.4", 1000 + i);
    expect(rl.isLimited("5.6.7.8", 2000)).toBe(false);
  });

  it("キー数が上限を超えると期限切れキーが掃除される", () => {
    const rl = createRateLimiter({ windowMs: 60_000, maxFailures: 5, maxKeys: 10 });
    for (let i = 0; i < 11; i++) rl.recordFailure(`ip-${i}`, 1000);
    // 全キーが期限切れになった後のアクセスで掃除が走り、サイズが上限内に戻る
    rl.recordFailure("fresh", 1000 + 60_000 + 1);
    expect(rl.size()).toBeLessThanOrEqual(10);
  });

  it("上限超過かつ全キーがアクティブなら clear して fail-open（制限を一時的に諦める）", () => {
    const rl = createRateLimiter({ windowMs: 60_000, maxFailures: 5, maxKeys: 10 });
    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < 11; i++) rl.recordFailure(`ip-${i}`, 2000 + j);
    }
    // ip-0 は5回失敗済みだが、clear 後は制限されない
    expect(rl.isLimited("ip-0", 3000)).toBe(false);
  });
});

describe("認証失敗のレート制限（IP 単位）", () => {
  // モジュールレベルの limiter は状態を持つため、テストごとに固有 IP を使う
  const env = { BASIC_AUTH_USER: "admin", BASIC_AUTH_PASS: "secret" };

  async function failOnce(ip) {
    const { context } = makeContext({ env, authHeader: basicAuth("admin", "wrong"), ip });
    return onRequest(context);
  }

  it("失敗が上限に達すると 429 と Retry-After を返す", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await failOnce("10.0.0.1");
      expect(res.status).toBe(401);
    }
    const res = await failOnce("10.0.0.1");
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("制限中は正しい資格情報でも 429 を返す（ロックアウト）", async () => {
    for (let i = 0; i < 5; i++) await failOnce("10.0.0.2");
    const { context, wasNextCalled } = makeContext({
      env,
      authHeader: basicAuth("admin", "secret"),
      ip: "10.0.0.2",
    });
    const res = await onRequest(context);
    expect(res.status).toBe(429);
    expect(wasNextCalled()).toBe(false);
  });

  it("認証成功はカウントされない（正規利用は制限されない）", async () => {
    for (let i = 0; i < 10; i++) {
      const { context } = makeContext({
        env,
        authHeader: basicAuth("admin", "secret"),
        ip: "10.0.0.3",
      });
      const res = await onRequest(context);
      expect(res.status).toBe(200);
    }
  });

  it("他 IP の失敗に巻き込まれない", async () => {
    for (let i = 0; i < 6; i++) await failOnce("10.0.0.4");
    const { context } = makeContext({
      env,
      authHeader: basicAuth("admin", "secret"),
      ip: "10.0.0.5",
    });
    const res = await onRequest(context);
    expect(res.status).toBe(200);
  });

  it("Authorization ヘッダー無し（Basic 認証の正常なハンドシェイク）は何回でもカウントされない", async () => {
    for (let i = 0; i < 10; i++) {
      const { context } = makeContext({ env, ip: "10.0.0.6" });
      const res = await onRequest(context);
      expect(res.status).toBe(401);
    }
    // ヘッダー無し 10 回の後でも、正しい資格情報は通る
    const { context } = makeContext({
      env,
      authHeader: basicAuth("admin", "secret"),
      ip: "10.0.0.6",
    });
    const res = await onRequest(context);
    expect(res.status).toBe(200);
  });

  it("CF-Connecting-IP が無い場合は制限しない（識別子が無いので fail-open）", async () => {
    for (let i = 0; i < 10; i++) {
      const { context } = makeContext({ env, authHeader: basicAuth("admin", "wrong") });
      const res = await onRequest(context);
      expect(res.status).toBe(401);
    }
  });
});
