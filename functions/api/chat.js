// AI endpoint: chat with 锐锐酱, or generate a site theme from a description.
import { askAI, PERSONA } from "./_ai.js";

const THEME_SYSTEM = `你是网站换装魔法师。用户描述想要的网站风格，你输出一个JSON对象（不要markdown代码块），格式：
{"theme":{"--bg":"页面背景色","--bg2":"次背景色","--pri":"主题色(可爱明亮)","--pri-deep":"深主题色","--acc":"点缀色","--ink":"正文字色(要和背景有足够对比度)","--ink-soft":"浅字色","--fs":"字号如16px或18px","--radius":"圆角如1.6rem"},"comment":"一句可爱的变身宣言(20字内)"}
所有颜色用hex。保持整体柔和可爱、可读性好。只输出JSON。`;

export async function onRequestPost({ request, env }) {
  if (!env.ZHIPU_API_KEY) return json({ error: "ZHIPU_API_KEY not configured" }, 500);
  const body = await request.json().catch(() => ({}));

  if (body.mode === "theme") {
    const content = await askAI(env, [{ role: "user", content: String(body.desc || "").slice(0, 200) }],
      { system: THEME_SYSTEM, max_tokens: 400 });
    try {
      return json(JSON.parse(content.replace(/^```json?|```$/g, "").trim()));
    } catch { return json({ error: "bad theme json" }, 502); }
  }

  const reply = await askAI(env, Array.isArray(body.messages) ? body.messages.slice(-10) : [], { system: PERSONA });
  return reply ? json({ reply }) : json({ error: "upstream" }, 502);
}

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
