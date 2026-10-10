import { test } from "node:test";
import assert from "node:assert/strict";
import { askAI } from "../functions/api/_ai.js";
import { resolveAIConfig, handleConfig, CONFIG_KEY, validateAPIURL } from "../functions/api/_config.js";
function env() {
  const values = new Map();
  return { DEEPSEEK_API_KEY: "test-key", BOARD: { get: async key => values.get(key) ?? null, put: async (key, value) => values.set(key, value) } };
}
test("DeepSeek defaults reach the correct endpoint and model without live AI calls", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.deepseek.com/chat/completions");
      assert.equal(JSON.parse(options.body).model, "deepseek-flash");
      assert.equal(options.redirect, "error");
      assert.equal(options.headers.Authorization, "Bearer test-key");
      return Response.json({ choices: [{ message: { content: "mock reply" } }] });
    };
    assert.equal(await askAI(env(), [{ role: "user", content: "hello" }]), "mock reply");
  } finally { globalThis.fetch = original; }
});
test("custom endpoint and model persist and provider keys stay scoped to their host", async () => {
  const environment = env();
  const response = await handleConfig(new Request("https://site.test/api/admin?dataset=ai", { method: "POST", body: JSON.stringify({ apiURL: "https://ai.example.com/v1/chat/completions", model: "provider/custom-model", prompt: "hello", enabled: true }) }), environment);
  assert.equal(response.status, 200);
  const resolved = await resolveAIConfig(environment);
  assert.equal(resolved.apiURL, "https://ai.example.com/v1/chat/completions");
  assert.equal(resolved.model, "provider/custom-model");
  assert.equal(resolved.apiKey, undefined);
  assert.equal((await resolveAIConfig({ ...environment, AI_API_KEY: "custom-key" })).apiKey, "custom-key");
});
test("invalid upstream addresses cannot overwrite configuration", async () => {
  const environment = env();
  for (const apiURL of ["http://ai.example.com/chat/completions", "https://127.0.0.1/api", "https://[::1]/api", "https://localhost/api", "https://service.internal/api", "https://user:secret@ai.example.com/api", "https://ai.example.com/api?key=secret", "https://ai.example.com:8443/api"]) {
    assert.throws(() => validateAPIURL(apiURL));
    const response = await handleConfig(new Request("https://site.test/api/admin?dataset=ai", { method: "POST", body: JSON.stringify({ apiURL, model: "deepseek-flash", prompt: "hello", enabled: true }) }), environment);
    assert.equal(response.status, 400);
    assert.equal(await environment.BOARD.get(CONFIG_KEY), null);
  }
});
