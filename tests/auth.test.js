import { test } from "node:test";
import assert from "node:assert/strict";
import {
  onRequestPost as login,
  onRequestGet as status,
  onRequestDelete as logout,
} from "../functions/api/admin-session.js";
import { onRequestGet as adminGet, onRequestPost as adminPost } from "../functions/api/admin.js";
import { COOKIE_NAME, createSession, SESSION_SECONDS } from "../functions/api/_auth.js";
function env() {
  const data = new Map();
  return {
    ADMIN_TOKEN: "test-secret-".repeat(5),
    ADMIN_PASSWORD: "test-login-password",
    BOARD: {
      get: async (key) => data.get(key) ?? null,
      put: async (key, value) => data.set(key, value),
    },
  };
}
const request = (method, body, cookie, origin = "https://example.test") =>
  new Request("https://example.test/api/admin-session", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
async function signIn(environment) {
  const response = await login({
    env: environment,
    request: request("POST", { password: environment.ADMIN_PASSWORD }),
  });
  assert.equal(response.status, 200);
  return response.headers.get("Set-Cookie");
}
test("password login sets a signed HttpOnly secure cookie, exposes no credentials, and restores a session", async () => {
  const environment = env();
  const cookie = await signIn(environment);
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
  assert.ok(cookie.startsWith(COOKIE_NAME + "="));
  assert.ok(cookie.includes(`Max-Age=${SESSION_SECONDS}`));
  assert.ok(
    !cookie.includes(environment.ADMIN_TOKEN) && !cookie.includes(environment.ADMIN_PASSWORD),
  );
  const result = await status({
    env: environment,
    request: request("GET", null, cookie.split(";")[0]),
  });
  assert.deepEqual(await result.json(), { authenticated: true });
  const response = await adminGet({
    env: environment,
    request: new Request("https://example.test/api/admin?dataset=overview", {
      headers: { Cookie: cookie },
    }),
  });
  assert.equal(response.status, 200);
});
test("invalid passwords, forged cookies, expired cookies and secret rotation cannot access admin", async () => {
  const environment = env();
  assert.equal(
    (await login({ env: environment, request: request("POST", { password: "wrong" }) })).status,
    401,
  );
  const value = await createSession(environment);
  for (const cookie of [
    COOKIE_NAME + "=" + value.replace(/.$/, value.endsWith("0") ? "1" : "0"),
    COOKIE_NAME + "=" + value.replace(/^\d+/, "1"),
  ]) {
    assert.equal(
      (await status({ env: environment, request: request("GET", null, cookie) })).status,
      401,
    );
  }
  environment.ADMIN_TOKEN += "rotated";
  assert.equal(
    (await status({ env: environment, request: request("GET", null, COOKIE_NAME + "=" + value) }))
      .status,
    401,
  );
});
test("cross-origin login, logout and cookie-authorized writes are rejected", async () => {
  const environment = env();
  const cookie = await signIn(environment);
  for (const origin of [null, "https://attacker.test"]) {
    assert.equal(
      (
        await login({
          env: environment,
          request: request("POST", { password: environment.ADMIN_PASSWORD }, null, origin),
        })
      ).status,
      403,
    );
    assert.equal(
      (await logout({ env: environment, request: request("DELETE", null, cookie, origin) })).status,
      403,
    );
    const req = new Request("https://example.test/api/admin?dataset=ai", {
      method: "POST",
      headers: { Cookie: cookie, ...(origin ? { Origin: origin } : {}) },
      body: "{}",
    });
    assert.equal((await adminPost({ env: environment, request: req })).status, 403);
  }
});
test("logout clears the cookie and revokes the server session", async () => {
  const environment = env();
  const cookie = await signIn(environment);
  const response = await logout({ env: environment, request: request("DELETE", null, cookie) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Set-Cookie"), /Max-Age=0/);
  assert.equal(
    (await status({ env: environment, request: request("GET", null, cookie) })).status,
    401,
  );
});
test("repeated wrong passwords are throttled without issuing a cookie", async () => {
  const environment = env();
  for (let i = 0; i < 10; i++) {
    const response = await login({
      env: environment,
      request: request("POST", { password: "wrong" }),
    });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("Set-Cookie"), null);
  }
  assert.equal(
    (
      await login({
        env: environment,
        request: request("POST", { password: environment.ADMIN_PASSWORD }),
      })
    ).status,
    429,
  );
});
