import { handleContent } from "./_content.js";
import { handleConfig } from "./_config.js";
import { json, readObject } from "./_http.js";

const DATASETS = { board: "guestbook", forum: "forum", room: "room", rate: "rates" };
const digest = async (value) =>
  new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
const recordId = async (value) =>
  Array.from(await digest(JSON.stringify(value)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
async function authorize(request, env) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32)
    return json({ error: "admin not configured" }, 503);
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1] ?? "";
  const [actual, expected] = await Promise.all([digest(token), digest(env.ADMIN_TOKEN)]);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= actual[i] ^ expected[i];
  return difference ? json({ error: "unauthorized" }, 401) : null;
}
async function handle({ request, env }) {
  const denied = await authorize(request, env);
  if (denied) return denied;
  if (!env.BOARD) return json({ error: "KV not bound" }, 503);
  const dataset = new URL(request.url).searchParams.get("dataset");
  if (dataset === "content") return handleContent(request, env);
  if (dataset === "ai") return handleConfig(request, env);
  if (!Object.hasOwn(DATASETS, dataset)) return json({ error: "invalid dataset" }, 400);
  const value = JSON.parse(
    (await env.BOARD.get(DATASETS[dataset])) || (dataset === "rate" ? "{}" : "[]"),
  );
  if (
    (dataset === "rate" && (!value || typeof value !== "object" || Array.isArray(value))) ||
    (dataset !== "rate" && !Array.isArray(value))
  )
    throw new Error("invalid stored data");
  const records =
    dataset === "rate"
      ? Object.entries(value).map(([id, data]) => ({ id, data }))
      : await Promise.all(value.map(async (data) => ({ id: await recordId(data), data })));
  if (request.method === "GET") return json({ dataset, records });
  const body = await readObject(request).catch(() => ({}));
  if (typeof body.id !== "string" || !records.some((record) => record.id === body.id))
    return json({ error: "record not found or changed" }, 409);
  if (dataset === "rate") delete value[body.id];
  else
    value.splice(
      records.findIndex((record) => record.id === body.id),
      1,
    );
  await env.BOARD.put(DATASETS[dataset], JSON.stringify(value));
  return json({ deleted: body.id });
}
async function safely(context) {
  try {
    return await handle(context);
  } catch (error) {
    console.error("admin operation failed", error instanceof Error ? error.name : "unknown");
    return json({ error: "storage unavailable" }, 503);
  }
}
export const onRequestGet = safely;
export const onRequestDelete = safely;

export const onRequestPost = safely;
