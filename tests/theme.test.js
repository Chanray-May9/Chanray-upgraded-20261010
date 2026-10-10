import { test } from "node:test";
import assert from "node:assert/strict";
import { handleTheme, readTheme, THEME_KEY } from "../functions/api/_theme.js";
const request = (body) =>
  new Request("https://example.test/api/admin?dataset=theme", {
    method: "POST",
    body: JSON.stringify(body),
  });
function env() {
  const values = new Map();
  return {
    BOARD: {
      get: async (key) => values.get(key) ?? null,
      put: async (key, value) => values.set(key, value),
    },
    values,
  };
}
test("theme defaults to pink and changes preserve a prior snapshot", async () => {
  const environment = env();
  assert.equal((await readTheme(environment)).mode, "pink");
  const result = await handleTheme(
    request({
      baseRevision: "initial",
      mode: "dark",
      pinkBackground: "#fff0f8",
      darkBackground: "#020102",
    }),
    environment,
  );
  assert.equal(result.status, 200);
  assert.equal((await readTheme(environment)).mode, "dark");
  assert.equal(
    [...environment.values.keys()].filter((key) => key.startsWith("private:site-theme:history:"))
      .length,
    1,
  );
  assert.equal(
    (
      await handleTheme(
        request({
          baseRevision: "initial",
          mode: "pink",
          pinkBackground: "#fff5fa",
          darkBackground: "#020102",
        }),
        environment,
      )
    ).status,
    409,
  );
});
test("invalid styles cannot become executable CSS or overwrite a theme", async () => {
  const environment = env();
  for (const body of [
    { mode: "other", pinkBackground: "#ffffff", darkBackground: "#000000" },
    { mode: "pink", pinkBackground: "url(https://evil.test)", darkBackground: "#000000" },
  ]) {
    assert.equal(
      (await handleTheme(request({ baseRevision: "initial", ...body }), environment)).status,
      400,
    );
    assert.equal(await environment.BOARD.get(THEME_KEY), null);
  }
});
test("theme backup failure prevents publishing", async () => {
  const environment = env();
  environment.BOARD.put = async () => {
    throw Error("backup unavailable");
  };
  await assert.rejects(
    handleTheme(
      request({
        baseRevision: "initial",
        mode: "pink",
        pinkBackground: "#fff5fa",
        darkBackground: "#020102",
      }),
      environment,
    ),
  );
  assert.equal(await environment.BOARD.get(THEME_KEY), null);
});
