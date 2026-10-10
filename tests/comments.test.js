import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequestGet as get, onRequestPost as post } from "../functions/api/comments.js";
import { onRequestGet as adminGet, onRequestPost as adminPost } from "../functions/api/admin.js";
function setup() {
  const map = new Map();
  return {
    map,
    env: {
      ADMIN_TOKEN: "a".repeat(32),
      BOARD: {
        get: async (k) => map.get(k) || null,
        put: async (k, v) => map.set(k, v),
        list: async ({ prefix }) => ({
          keys: [...map.keys()]
            .filter((k) => k.startsWith(prefix))
            .sort()
            .map((name) => ({ name })),
          list_complete: true,
        }),
      },
    },
  };
}
const req = (url, body, headers = {}) =>
  new Request("https://test.local" + url, {
    method: body ? "POST" : "GET",
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const comment = (overrides = {}) => ({
  name: "访客",
  message: "<img src=x onerror=alert(1)>",
  website: "",
  ...overrides,
});
test("comments require valid page and fields, throttle hashed addresses and honor honeypot", async () => {
  const { env, map } = setup();
  for (const body of [
    comment({ name: " " }),
    comment({ message: "x".repeat(2001) }),
    comment({ website: "spam" }),
    comment({ message: 7 }),
  ])
    assert.equal((await post({ request: req("/api/comments?page=home", body), env })).status, 400);
  assert.equal((await get({ request: req("/api/comments?page=admin"), env })).status, 400);
  for (let i = 0; i < 3; i++)
    assert.equal(
      (
        await post({
          request: req("/api/comments?page=home", comment(), { "CF-Connecting-IP": "192.0.2.1" }),
          env,
        })
      ).status,
      201,
    );
  assert.equal(
    (
      await post({
        request: req("/api/comments?page=home", comment(), { "CF-Connecting-IP": "192.0.2.1" }),
        env,
      })
    ).status,
    429,
  );
  assert.ok(![...map.keys()].join().includes("192.0.2.1"));
});
test("pending comments stay private; moderation, replies, hiding and recovery preserve versions", async () => {
  const { env, map } = setup();
  const headers = { Authorization: "Bearer " + env.ADMIN_TOKEN };
  const url = "/api/admin?dataset=comments";
  assert.equal((await adminGet({ request: req(url), env })).status, 401);
  await post({ request: req("/api/comments?page=home", comment()), env });
  assert.deepEqual(
    (await (await get({ request: req("/api/comments?page=home"), env })).json()).items,
    [],
  );
  let item = (await (await adminGet({ request: req(url, null, headers), env })).json()).items[0];
  const moderate = async (status, reply = "回复") => {
    const r = await adminPost({
      request: req(
        url,
        {
          action: "moderate",
          id: item.id,
          baseRevision: item.revision,
          status,
          reply,
          pinned: true,
        },
        headers,
      ),
      env,
    });
    assert.equal(r.status, 200);
    item = (await r.json()).item;
  };
  const original = item.revision;
  await moderate("approved");
  const visible = (await (await get({ request: req("/api/comments?page=home"), env })).json())
    .items[0];
  assert.equal(visible.message, comment().message);
  assert.equal(visible.reply, "回复");
  assert.equal(visible.revision, undefined);
  assert.equal(visible.status, undefined);
  assert.equal(
    (
      await adminPost({
        request: req(
          url,
          {
            action: "moderate",
            id: item.id,
            baseRevision: original,
            status: "hidden",
            reply: "",
            pinned: false,
          },
          headers,
        ),
        env,
      })
    ).status,
    409,
  );
  await moderate("hidden");
  assert.equal(
    (await (await get({ request: req("/api/comments?page=home"), env })).json()).items.length,
    0,
  );
  await moderate("deleted");
  await moderate("pending");
  assert.equal(item.status, "pending");
  assert.equal([...map.keys()].filter((k) => k.startsWith("private:comments:history:")).length, 4);
  assert.equal(
    (await (await get({ request: req("/api/comments?page=gallery"), env })).json()).items.length,
    0,
  );
});
test("admin can close comments and change approval policy with version checks", async () => {
  const { env } = setup();
  const headers = { Authorization: "Bearer " + env.ADMIN_TOKEN };
  const url = "/api/admin?dataset=comments";
  let r = await adminPost({
    request: req(
      url,
      { action: "settings", baseRevision: "initial", enabled: false, requireApproval: true },
      headers,
    ),
    env,
  });
  assert.equal(r.status, 200);
  const settings = (await r.json()).settings;
  assert.equal(
    (await post({ request: req("/api/comments?page=home", comment()), env })).status,
    403,
  );
  assert.equal(
    (await (await get({ request: req("/api/comments?page=home"), env })).json()).enabled,
    false,
  );
  assert.equal(
    (
      await adminPost({
        request: req(
          url,
          { action: "settings", baseRevision: "initial", enabled: true, requireApproval: false },
          headers,
        ),
        env,
      })
    ).status,
    409,
  );
  await adminPost({
    request: req(
      url,
      {
        action: "settings",
        baseRevision: settings.revision,
        enabled: true,
        requireApproval: false,
      },
      headers,
    ),
    env,
  });
  assert.equal(
    (await (await post({ request: req("/api/comments?page=home", comment()), env })).json())
      .pending,
    false,
  );
  assert.equal(
    (await (await get({ request: req("/api/comments?page=home"), env })).json()).items.length,
    1,
  );
});
test("failed moderation backup prevents writes; overview never exposes credentials", async () => {
  const { env, map } = setup();
  const headers = { Authorization: "Bearer " + env.ADMIN_TOKEN };
  await post({ request: req("/api/comments?page=home", comment()), env });
  const [id] = [...map.keys()].filter((k) => k.startsWith("comments:"));
  const original = map.get(id);
  const item = JSON.parse(original);
  const put = env.BOARD.put;
  env.BOARD.put = async (k, v) => {
    if (k.startsWith("private:comments:history:")) throw Error("backup failed");
    return put(k, v);
  };
  assert.equal(
    (
      await adminPost({
        request: req(
          "/api/admin?dataset=comments",
          {
            action: "moderate",
            id,
            baseRevision: item.revision,
            status: "approved",
            reply: "",
            pinned: false,
          },
          headers,
        ),
        env,
      })
    ).status,
    503,
  );
  assert.equal(map.get(id), original);
  const r = await adminGet({
    request: req("/api/admin?dataset=overview", null, headers),
    env: { ...env, ZHIPU_API_KEY: "secret-test" },
  });
  assert.equal(r.status, 200);
  assert.ok(!(await r.text()).includes("secret-test"));
  assert.equal(
    (await adminPost({ request: req("/api/admin?dataset=board", { id: "no" }, headers), env }))
      .status,
    405,
  );
});
