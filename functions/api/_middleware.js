// Public GitHub Pages requests only; administrative cookies remain same-origin.
const FRONTEND = "https://chanray-may9.github.io";
const PUBLIC = new Set(["chat", "comments", "content", "theme", "board", "forum", "room", "rate"]);
export async function onRequest({ request, next }) {
  const endpoint = new URL(request.url).pathname.split("/").pop();
  const allowed = request.headers.get("Origin") === FRONTEND && PUBLIC.has(endpoint);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? {
      "Access-Control-Allow-Origin": FRONTEND,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    } : {} });
  }
  const response = await next();
  if (!allowed) return response;
  const result = new Response(response.body, response);
  result.headers.set("Access-Control-Allow-Origin", FRONTEND);
  result.headers.append("Vary", "Origin");
  return result;
}
