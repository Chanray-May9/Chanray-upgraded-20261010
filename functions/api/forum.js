import { json, ok, readObject } from "./_http.js";
// Forum threads + replies in KV (namespace BOARD). Mention @锐锐酱 in a reply to summon the AI.
import { askAI } from "./_ai.js";
const KEY = "forum";

const load = async (env) => JSON.parse((await env.BOARD.get(KEY)) || "[]");
const save = (env, list) => env.BOARD.put(KEY, JSON.stringify(list.slice(0, 100)));

export async function onRequestGet({ env }) {
  if (!env.BOARD) return json([]);
  return json(await load(env));
}

export async function onRequestPost({ request, env }) {
  if (!env.BOARD) return json({ error: "KV not bound" }, 500);
  const b = await readObject(request).catch(() => ({}));
  const list = await load(env);

  if (b.op === "thread") {
    if (!ok(b.name, 16) || !ok(b.title, 40) || !ok(b.body, 500))
      return json({ error: "invalid" }, 400);
    list.unshift({
      id: crypto.randomUUID().slice(0, 8),
      name: b.name,
      title: b.title,
      body: b.body,
      t: Date.now(),
      replies: [],
    });
  } else if (b.op === "reply") {
    const th = list.find((x) => x.id === b.id);
    if (!th || !ok(b.name, 16) || !ok(b.text, 200)) return json({ error: "invalid" }, 400);
    th.replies.push({ name: b.name, text: b.text, t: Date.now() });
    if (th.replies.length > 50) th.replies.shift();
    if (/@锐锐酱/.test(b.text)) {
      const reply = await askAI(env, [
        {
          role: "user",
          content: `你在锐锐个人网站的论坛里被 @ 了。帖子标题「${th.title}」，正文「${th.body}」。${b.name} 对你说：「${b.text.replace("@锐锐酱", "")}」。请像论坛网友一样简短回复（60字内）。`,
        },
      ]);
      if (reply) th.replies.push({ name: "锐锐酱", ai: true, text: reply, t: Date.now() });
      th.replies = th.replies.slice(-50);
    }
  } else return json({ error: "bad op" }, 400);

  await save(env, list);
  return json(list);
}
