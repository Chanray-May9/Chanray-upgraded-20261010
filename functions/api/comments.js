import { json, ok, readObject } from "./_http.js";
import { COMMENT_PREFIX, PAGES, settings, listComments } from "./_comments.js";
const hash = async (value) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
async function handle({ request, env }) {
  if (!env.BOARD) return json({ error: "comments unavailable" }, 503);
  const config = await settings(env);
  const page = new URL(request.url).searchParams.get("page");
  if (!PAGES.includes(page)) return json({ error: "invalid page" }, 400);
  if (request.method === "GET") {
    if (!config.enabled) return json({ enabled: false, items: [], cursor: null });
    const { items, cursor } = await listComments(
      env,
      page,
      new URL(request.url).searchParams.get("cursor"),
    );
    return json({
      enabled: true,
      requireApproval: config.requireApproval,
      cursor,
      items: items
        .filter((x) => x.status === "approved")
        .map(({ id, name, message, createdAt, reply, pinned }) => ({
          id,
          name,
          message,
          createdAt,
          reply,
          pinned,
        })),
    });
  }
  if (!config.enabled) return json({ error: "comments closed" }, 403);
  const body = await readObject(request).catch(() => null);
  if (!body || !ok(body.name, 40) || !ok(body.message, 2000) || typeof body.website !== "string")
    return json({ error: "invalid comment" }, 400);
  if (body.website) return json({ error: "invalid comment" }, 400);
  const address = request.headers.get("CF-Connecting-IP");
  // KV throttling is approximate; production should also enable Cloudflare rate limiting.
  if (address) {
    const bucket =
      "private:comments:throttle:" + (await hash(address + ":" + Math.floor(Date.now() / 60000)));
    const count = Number((await env.BOARD.get(bucket)) || 0);
    if (count >= 3) return json({ error: "too many comments" }, 429);
    await env.BOARD.put(bucket, String(count + 1), { expirationTtl: 120 });
  }
  const createdAt = new Date().toISOString();
  const id =
    COMMENT_PREFIX +
    page +
    ":" +
    String(9999999999999 - Date.now()).padStart(13, "0") +
    ":" +
    crypto.randomUUID();
  const item = {
    page,
    name: body.name.trim(),
    message: body.message.trim(),
    createdAt,
    status: config.requireApproval ? "pending" : "approved",
    reply: "",
    pinned: false,
    revision: crypto.randomUUID(),
  };
  await env.BOARD.put(id, JSON.stringify(item));
  return json({ submitted: true, pending: config.requireApproval }, 201);
}
async function safely(context) {
  try {
    return await handle(context);
  } catch {
    return json({ error: "comments unavailable" }, 503);
  }
}
export const onRequestGet = safely;
export const onRequestPost = safely;
