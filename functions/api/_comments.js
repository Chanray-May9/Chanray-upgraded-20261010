import { json, readObject } from "./_http.js";
export const COMMENT_PREFIX = "comments:";
export const SETTINGS_KEY = "private:comments:settings";
export const PAGES = ["home", "works", "gallery", "log", "contact", "model", "afterdark"];
export async function settings(env) {
  const stored = JSON.parse((await env.BOARD.get(SETTINGS_KEY)) || "{}");
  return {
    enabled: stored.enabled !== false,
    requireApproval: stored.requireApproval !== false,
    revision: stored.revision || "initial",
  };
}
export async function listComments(env, page, cursor, limit = 30) {
  const list = await env.BOARD.list({
    prefix: COMMENT_PREFIX + (page ? page + ":" : ""),
    limit,
    ...(cursor ? { cursor } : {}),
  });
  const items = await Promise.all(
    list.keys.map(async ({ name }) => {
      const raw = await env.BOARD.get(name);
      return raw ? { ...JSON.parse(raw), id: name } : null;
    }),
  );
  return { items: items.filter(Boolean), cursor: list.list_complete ? null : list.cursor };
}
export async function handleCommentsAdmin(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const page = url.searchParams.get("page") || "";
    if (page && !PAGES.includes(page)) return json({ error: "invalid page" }, 400);
    return json({
      ...(await listComments(env, page, url.searchParams.get("cursor"))),
      settings: await settings(env),
    });
  }
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  const body = await readObject(request).catch(() => null);
  if (!body) return json({ error: "invalid body" }, 400);
  if (body.action === "settings") {
    const current = await settings(env);
    if (body.baseRevision !== current.revision) return json({ error: "settings changed" }, 409);
    if (typeof body.enabled !== "boolean" || typeof body.requireApproval !== "boolean")
      return json({ error: "invalid settings" }, 400);
    await env.BOARD.put(
      "private:comments:settings-backup:" + crypto.randomUUID(),
      JSON.stringify(current),
    );
    const next = {
      enabled: body.enabled,
      requireApproval: body.requireApproval,
      revision: crypto.randomUUID(),
    };
    await env.BOARD.put(SETTINGS_KEY, JSON.stringify(next));
    return json({ settings: next });
  }
  if (
    body.action !== "moderate" ||
    typeof body.id !== "string" ||
    !/^comments:(home|works|gallery|log|contact|model|afterdark):\d{13}:[a-f0-9-]{36}$/.test(
      body.id,
    )
  )
    return json({ error: "invalid record" }, 400);
  const raw = await env.BOARD.get(body.id);
  if (!raw) return json({ error: "not found" }, 404);
  const current = JSON.parse(raw);
  if (body.baseRevision !== current.revision) return json({ error: "record changed" }, 409);
  if (
    !["pending", "approved", "hidden", "deleted"].includes(body.status) ||
    typeof body.reply !== "string" ||
    body.reply.length > 2000 ||
    typeof body.pinned !== "boolean"
  )
    return json({ error: "invalid moderation" }, 400);
  // Preserve the previous record before any visibility or reply change.
  await env.BOARD.put(
    "private:comments:history:" + crypto.randomUUID(),
    JSON.stringify({ id: body.id, record: current }),
  );
  const next = {
    ...current,
    status: body.status,
    reply: body.reply.trim(),
    pinned: body.pinned,
    revision: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  await env.BOARD.put(body.id, JSON.stringify(next));
  return json({ item: { ...next, id: body.id } });
}
