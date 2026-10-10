import { DEFAULT_THEME } from "../../public/site-theme-runtime.js";
import { json, readObject } from "./_http.js";
export const THEME_KEY = "public:site-theme:v1";
export async function readTheme(env) {
  return {
    ...DEFAULT_THEME,
    revision: "initial",
    ...JSON.parse((await env.BOARD?.get(THEME_KEY)) || "{}"),
  };
}
export async function handleTheme(request, env) {
  const current = await readTheme(env);
  if (request.method === "GET") return json(current);
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  const body = await readObject(request).catch(() => null);
  if (
    !body ||
    !["pink", "dark"].includes(body.mode) ||
    !/^#[0-9a-f]{6}$/i.test(body.pinkBackground || "") ||
    !/^#[0-9a-f]{6}$/i.test(body.darkBackground || "")
  )
    return json({ error: "invalid theme" }, 400);
  if (body.baseRevision !== current.revision) return json({ error: "theme changed, reload" }, 409);
  await env.BOARD.put(
    "private:site-theme:history:" + Date.now() + ":" + crypto.randomUUID(),
    JSON.stringify(current),
  );
  const next = {
    mode: body.mode,
    pinkBackground: body.pinkBackground,
    darkBackground: body.darkBackground,
    revision: crypto.randomUUID(),
  };
  await env.BOARD.put(THEME_KEY, JSON.stringify(next));
  return json(next);
}
