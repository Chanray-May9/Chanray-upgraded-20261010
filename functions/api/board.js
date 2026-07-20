// Guestbook backed by Cloudflare KV. Bind a KV namespace named BOARD to the Pages project.
const KEY = "guestbook";

export async function onRequestGet({ env }) {
  if (!env.BOARD) return json([], 200);
  const list = JSON.parse((await env.BOARD.get(KEY)) || "[]");
  return json(list);
}

export async function onRequestPost({ request, env }) {
  if (!env.BOARD) return json({ error: "KV not bound" }, 500);
  const { name, msg } = await request.json().catch(() => ({}));
  if (!name || !msg || String(name).length > 16 || String(msg).length > 120)
    return json({ error: "invalid" }, 400);
  const list = JSON.parse((await env.BOARD.get(KEY)) || "[]");
  list.unshift({ name: String(name), msg: String(msg), t: Date.now() });
  await env.BOARD.put(KEY, JSON.stringify(list.slice(0, 200)));
  return json(list);
}

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
