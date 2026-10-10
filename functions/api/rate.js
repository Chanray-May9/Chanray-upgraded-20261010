import { json, ok, readObject } from "./_http.js";
// Photo star ratings in KV: { photoId: { sum, count } }.
const KEY = "rates";

export async function onRequestGet({ env }) {
  if (!env.BOARD) return json({});
  return json(JSON.parse((await env.BOARD.get(KEY)) || "{}"));
}

export async function onRequestPost({ request, env }) {
  if (!env.BOARD) return json({ error: "KV not bound" }, 500);
  const { id, stars } = await readObject(request).catch(() => ({}));
  const n = stars;
  if (
    !ok(id, 64) ||
    !/^[a-zA-Z0-9_-]+$/.test(id) ||
    ["__proto__", "constructor", "prototype"].includes(id) ||
    !Number.isInteger(n) ||
    !(n >= 1 && n <= 5)
  )
    return json({ error: "invalid" }, 400);
  const all = JSON.parse((await env.BOARD.get(KEY)) || "{}");
  const r = Object.hasOwn(all, id) ? all[id] : { sum: 0, count: 0 };
  r.sum += Math.round(n);
  r.count++;
  all[id] = r;
  await env.BOARD.put(KEY, JSON.stringify(all));
  return json(all);
}
