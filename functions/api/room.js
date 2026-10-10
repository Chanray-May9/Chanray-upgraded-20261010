import { json, ok, readObject } from "./_http.js";
// Public chat room in KV, polled by clients. @锐锐酱 summons the AI into the room.
import { askAI } from "./_ai.js";
const KEY = "room";

export async function onRequestGet({ request, env }) {
  if (!env.BOARD) return json([]);
  const since = +new URL(request.url).searchParams.get("since") || 0;
  const list = JSON.parse((await env.BOARD.get(KEY)) || "[]");
  return json(list.filter((m) => m.t > since));
}

export async function onRequestPost({ request, env }) {
  if (!env.BOARD) return json({ error: "KV not bound" }, 500);
  const { name, text } = await readObject(request).catch(() => ({}));
  if (!ok(name, 16) || !ok(text, 200)) return json({ error: "invalid" }, 400);

  const list = JSON.parse((await env.BOARD.get(KEY)) || "[]");
  list.push({ name: String(name), text: String(text), t: Date.now() });

  if (/@锐锐酱/.test(text)) {
    const recent = list
      .slice(-8)
      .map((m) => `${m.name}: ${m.text}`)
      .join("\n");
    const reply = await askAI(env, [
      {
        role: "user",
        content: `你在锐锐个人网站的公共聊天室里。最近的聊天记录：\n${recent}\n\n${name} @了你。请自然地接话，简短（50字内），像群里的元气网友。`,
      },
    ]);
    if (reply) list.push({ name: "锐锐酱", ai: true, text: reply, t: Date.now() + 1 });
  }

  await env.BOARD.put(KEY, JSON.stringify(list.slice(-100)));
  return json(list.slice(-30));
}
