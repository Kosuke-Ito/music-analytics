import { describe, it, expect } from "vitest";
import { onRequest } from "../api/_middleware.js";

function makeContext({ env = {}, authHeader = null } = {}) {
  const headers = new Headers();
  if (authHeader) headers.set("Authorization", authHeader);
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
