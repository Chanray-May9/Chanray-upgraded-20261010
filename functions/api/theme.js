import { readTheme } from "./_theme.js";
import { json } from "./_http.js";
export async function onRequestGet({ env }) {
  try {
    const response = json(await readTheme(env));
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch {
    return json({ error: "theme unavailable" }, 503);
  }
}
