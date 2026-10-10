import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/api/admin.js";
import { onRequestGet as publicContent } from "../functions/api/content.js";
import { CONTENT_KEY, HISTORY_PREFIX } from "../functions/api/_content.js";
import { translateText } from "../public/site-content-runtime.js";
function environment() {
  const values = new Map();
  const metadata = new Map();
  return {
    ADMIN_TOKEN: "a".repeat(32),
    BOARD: {
      get: async (key) => values.get(key) || null,
      put: async (key, value, options) => {
        values.set(key, value);
        metadata.set(key, options?.metadata);
      },
      list: async ({ prefix }) => ({
        keys: [...values.keys()]
          .filter((key) => key.startsWith(prefix))
          .sort()
          .map((name) => ({ name, metadata: metadata.get(name) })),
        list_complete: true,
      }),
    },
  };
}
function request(body, token = "a".repeat(32)) {
  return new Request("https://example.test/api/admin?dataset=content", {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test("content management is protected and covers every public area and legacy pages", async () => {
  const env = environment();
  assert.equal((await onRequestGet({ request: request(undefined, "wrong"), env })).status, 401);
  const body = await (await onRequestGet({ request: request(), env })).json();
  const groups = new Set(body.catalog.flatMap((entry) => entry.groups));
  for (const group of ["首页", "作品", "相册", "时间线", "联系", "3D", "调情专区", "旧版页面"])
    assert.ok(groups.has(group), group);
  assert.equal(body.revision, "initial");
});
test("publishing snapshots the complete prior version and restoring snapshots is itself reversible", async () => {
  const env = environment();
  const first = await onRequestPost({
    request: request({
      action: "publish",
      baseRevision: "initial",
      overrides: { CHANRAY: "新名字" },
    }),
    env,
  });
  assert.equal(first.status, 200);
  const one = await first.json();
  assert.deepEqual(JSON.parse(await env.BOARD.get(one.backup)).overrides, {});
  const second = await onRequestPost({
    request: request({
      action: "publish",
      baseRevision: one.revision,
      overrides: { CHANRAY: "另一个名字", 调情专区: "" },
    }),
    env,
  });
  const two = await second.json();
  const restore = await onRequestPost({
    request: request({ action: "restore", baseRevision: two.revision, snapshot: two.backup }),
    env,
  });
  const restored = await restore.json();
  assert.deepEqual(restored.overrides, { CHANRAY: "新名字" });
  assert.deepEqual(JSON.parse(await env.BOARD.get(restored.backup)).overrides, {
    CHANRAY: "另一个名字",
    调情专区: "",
  });
});
test("stale, malformed and oversized publications cannot overwrite content", async () => {
  const env = environment();
  for (const body of [
    { action: "publish", baseRevision: "old", overrides: {} },
    { action: "publish", baseRevision: "initial", overrides: { title: 123 } },
    { action: "publish", baseRevision: "initial", overrides: [] },
    { action: "publish", baseRevision: "initial", overrides: { title: "x".repeat(6001) } },
  ])
    assert.ok((await onRequestPost({ request: request(body), env })).status >= 400);
  assert.equal(await env.BOARD.get(CONTENT_KEY), null);
});
test("backup failure prevents publishing and private AI settings never appear in the public endpoint", async () => {
  const env = environment();
  await env.BOARD.put(
    "private:ai-config:v1",
    JSON.stringify({ prompt: "private prompt", secret: "private key" }),
  );
  const write = env.BOARD.put;
  env.BOARD.put = async (key, ...args) => {
    if (key.startsWith(HISTORY_PREFIX)) throw new Error("backup failed");
    return write(key, ...args);
  };
  const result = await onRequestPost({
    request: request({
      action: "publish",
      baseRevision: "initial",
      overrides: { CHANRAY: "hello" },
    }),
    env,
  });
  assert.equal(result.status, 503);
  assert.equal(await env.BOARD.get(CONTENT_KEY), null);
  const response = await publicContent({ env });
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.deepEqual(await response.json(), { overrides: {}, revision: "initial", updatedAt: null });
});
test("plain text replacement supports blank values, whitespace and HTML-looking text without executing markup", () => {
  assert.equal(
    translateText(" hello ", { hello: "<script>alert(1)</script>" }),
    " <script>alert(1)</script> ",
  );
  assert.equal(translateText("hidden", { hidden: "" }), "");
  assert.equal(translateText(42, {}), 42);
  assert.equal(translateText("constructor", {}), "constructor");
});
