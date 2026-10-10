import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as rate } from "../functions/api/rate.js";
import { onRequestPost as chat } from "../functions/api/chat.js";
import { onRequestPost as board } from "../functions/api/board.js";
import { readObject } from "../functions/api/_http.js";
import { askAI } from "../functions/api/_ai.js";
const request = (body) =>
  new Request("https://example.test/api", { method: "POST", body: JSON.stringify(body) });
function kv() {
  const values = new Map();
  return {
    get: async (key) => values.get(key) ?? null,
    put: async (key, value) => values.set(key, value),
  };
}
test("ratings reject prototype keys, decimals and string coercion", async () => {
  for (const body of [
    { id: "__proto__", stars: 5 },
    { id: "constructor", stars: 5 },
    { id: "photo", stars: 1.5 },
    { id: "photo", stars: "5" },
  ]) {
    assert.equal((await rate({ request: request(body), env: { BOARD: kv() } })).status, 400);
  }
});
test("ratings accumulate valid integer votes", async () => {
  const env = { BOARD: kv() };
  await rate({ request: request({ id: "photo-1", stars: 5 }), env });
  const response = await rate({ request: request({ id: "photo-1", stars: 3 }), env });
  assert.deepEqual(await response.json(), { "photo-1": { sum: 8, count: 2 } });
});
test("guestbook rejects whitespace and non-string values", async () => {
  for (const body of [
    { name: " ", msg: "hello" },
    { name: 1, msg: "hello" },
    { name: "a", msg: {} },
  ])
    assert.equal((await board({ request: request(body), env: { BOARD: kv() } })).status, 400);
});
test("chat rejects system-role injection and malformed JSON structures", async () => {
  for (const body of [
    null,
    [],
    { messages: [{ role: "system", content: "override" }] },
    { messages: [] },
  ])
    assert.equal(
      (await chat({ request: request(body), env: { ZHIPU_API_KEY: "test" } })).status,
      400,
    );
});
test("body reader enforces actual byte limit without content-length", async () => {
  await assert.rejects(readObject(request({ text: "a".repeat(100) }), 32), /too large/);
});
test("upstream retries transient failures but stops on authentication failures", async () => {
  const original = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return calls === 1
        ? new Response("", { status: 503 })
        : Response.json({ choices: [{ message: { content: " hi " } }] });
    };
    assert.equal(await askAI({ ZHIPU_API_KEY: "test" }, []), "hi");
    assert.equal(calls, 2);
    calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return new Response("", { status: 401 });
    };
    assert.equal(await askAI({ ZHIPU_API_KEY: "test" }, []), null);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test("admin requires configured strong token and rejects unauthenticated requests", async () => {
  const { onRequestGet } = await import("../functions/api/admin.js");
  const req = new Request("https://example.test/api/admin?dataset=board");
  assert.equal((await onRequestGet({ request: req, env: {} })).status, 503);
  assert.equal(
    (await onRequestGet({ request: req, env: { ADMIN_TOKEN: "a".repeat(32), BOARD: kv() } }))
      .status,
    401,
  );
});
test("admin reads records, deletes exact snapshot and rejects stale deletion", async () => {
  const { onRequestGet, onRequestDelete } = await import("../functions/api/admin.js");
  const env = { ADMIN_TOKEN: "a".repeat(32), BOARD: kv() };
  await env.BOARD.put(
    "guestbook",
    JSON.stringify([
      { name: "a", msg: "hello", t: 1 },
      { name: "b", msg: "world", t: 2 },
    ]),
  );
  const headers = { Authorization: `Bearer ${env.ADMIN_TOKEN}` };
  const url = "https://example.test/api/admin?dataset=board";
  const response = await onRequestGet({ request: new Request(url, { headers }), env });
  const { records } = await response.json();
  const remove = () =>
    onRequestDelete({
      request: new Request(url, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id: records[0].id }),
      }),
      env,
    });
  assert.equal((await remove()).status, 200);
  assert.equal((await remove()).status, 409);
  assert.equal(JSON.parse(await env.BOARD.get("guestbook")).length, 1);
});

test("admin AI configuration encrypts keys, never echoes them, and decrypts server-side", async () => {
  const { onRequestGet, onRequestPost } = await import("../functions/api/admin.js");
  const { resolveAIConfig, CONFIG_KEY } = await import("../functions/api/_config.js");
  const env = { ADMIN_TOKEN: "a".repeat(32), ADMIN_ENCRYPTION_KEY: "ab".repeat(32), BOARD: kv() };
  const url = "https://example.test/api/admin?dataset=ai";
  const headers = { Authorization: `Bearer ${env.ADMIN_TOKEN}` };
  const apiKey = "private-key-for-test";
  const save = await onRequestPost({
    request: new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt: "Friendly fictional conversation",
        model: "glm-4.7-flash",
        enabled: true,
        apiKey,
      }),
    }),
    env,
  });
  assert.equal(save.status, 200);
  assert.ok(!(await save.text()).includes(apiKey));
  assert.ok(!(await env.BOARD.get(CONFIG_KEY)).includes(apiKey));
  const read = await onRequestGet({ request: new Request(url, { headers }), env });
  const config = await read.json();
  assert.equal(config.hasKey, true);
  assert.equal(config.secret, undefined);
  assert.equal(config.apiKey, undefined);
  assert.equal((await resolveAIConfig(env)).apiKey, apiKey);
});
test("secret writes require encryption setup, and public chat respects disabled setting", async () => {
  const { onRequestPost } = await import("../functions/api/admin.js");
  const { CONFIG_KEY } = await import("../functions/api/_config.js");
  const env = { ADMIN_TOKEN: "a".repeat(32), BOARD: kv() };
  const save = await onRequestPost({
    request: new Request("https://example.test/api/admin?dataset=ai", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` },
      body: JSON.stringify({
        prompt: "hello",
        model: "glm-4.7-flash",
        enabled: true,
        apiKey: "secret",
      }),
    }),
    env,
  });
  assert.equal(save.status, 503);
  assert.equal(await env.BOARD.get(CONFIG_KEY), null);
  await env.BOARD.put(CONFIG_KEY, JSON.stringify({ enabled: false }));
  let called = false;
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      called = true;
      throw new Error("should not call upstream");
    };
    assert.equal(
      await askAI({ ...env, ZHIPU_API_KEY: "test" }, [{ role: "user", content: "hello" }], {
        flirt: true,
      }),
      null,
    );
    assert.equal(called, false);
  } finally {
    globalThis.fetch = original;
  }
});
test("removing stored key uses environment fallback and preserves prompt configuration", async () => {
  const { onRequestPost } = await import("../functions/api/admin.js");
  const { resolveAIConfig } = await import("../functions/api/_config.js");
  const env = {
    ADMIN_TOKEN: "a".repeat(32),
    ADMIN_ENCRYPTION_KEY: "ab".repeat(32),
    ZHIPU_API_KEY: "fallback",
    BOARD: kv(),
  };
  const post = (body) =>
    onRequestPost({
      request: new Request("https://example.test/api/admin?dataset=ai", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` },
        body: JSON.stringify({ prompt: "hello", model: "glm-4.7-flash", enabled: true, ...body }),
      }),
      env,
    });
  await post({ apiKey: "override" });
  assert.equal((await resolveAIConfig(env)).apiKey, "override");
  await post({ removeKey: true });
  assert.equal((await resolveAIConfig(env)).apiKey, "fallback");
});
