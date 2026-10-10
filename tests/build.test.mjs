import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
const siteBase = process.env.SITE_BASE_PATH || "/Chanray-upgraded-20261010/";
for (const route of ["", "works", "gallery", "log", "contact", "model", "admin", "afterdark"]) {
  test(`static route /${route} renders real content and base-prefixed assets`, async () => {
    const html = await readFile(`dist/client/${route ? route + "/" : ""}index.html`, "utf8");
    assert.ok(!html.includes("Page not found"));
    assert.match(html, /lang="zh-CN"/);
    assert.ok(html.includes(`${siteBase}assets/`));
    assert.ok(html.includes(`href="${siteBase}model"`));
    if (route === "model") assert.match(html, /CHARACTER.GLB/);
  });
}
test("3D model is included in deployable client assets", async () => {
  assert.ok((await stat("dist/client/character.glb")).size > 0);
});
