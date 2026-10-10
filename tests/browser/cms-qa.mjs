import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright-core";
import {
  onRequestGet as adminGet,
  onRequestPost as adminPost,
  onRequestDelete as adminDelete,
} from "../../functions/api/admin.js";
import {
  onRequestGet as commentsGet,
  onRequestPost as commentsPost,
} from "../../functions/api/comments.js";
import { onRequestGet as contentGet } from "../../functions/api/content.js";
const store = new Map();
const meta = new Map();
const env = {
  ADMIN_TOKEN: randomUUID() + randomUUID(),
  BOARD: {
    get: async (key) => store.get(key) || null,
    put: async (key, value, options) => {
      store.set(key, value);
      meta.set(key, options?.metadata);
    },
    list: async ({ prefix }) => ({
      keys: [...store.keys()]
        .filter((key) => key.startsWith(prefix))
        .sort()
        .map((name) => ({ name, metadata: meta.get(name) })),
      list_complete: true,
    }),
  },
};
const root = path.resolve("dist/client");
const screenshotDir = path.resolve(process.env.CMS_SCREENSHOT_DIR || "artifacts/cms");
await mkdir(screenshotDir, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://" + req.headers.host);
    if (url.pathname.startsWith("/api/")) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        ...(body.length ? { body } : {}),
      });
      let response;
      if (url.pathname === "/api/content") response = await contentGet({ request, env });
      else if (url.pathname === "/api/comments")
        response = await (req.method === "POST" ? commentsPost : commentsGet)({ request, env });
      else if (url.pathname === "/api/admin")
        response = await (
          req.method === "POST" ? adminPost : req.method === "DELETE" ? adminDelete : adminGet
        )({ request, env });
      else response = Response.json([]);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const relative = decodeURIComponent(url.pathname.replace(/^\/Chanray\/?/, ""));
    let file = path.resolve(root, relative || "index.html");
    if (!file.startsWith(root + "/")) {
      res.writeHead(403);
      res.end();
      return;
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".jpg": "image/jpeg",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".glb": "model/gltf-binary",
    };
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
context.on("page", (page) =>
  page.on("pageerror", (error) => errors.push(page.url() + " | " + error.message)),
);
page.on("pageerror", (error) => errors.push(page.url() + " | " + error.message));
const base = "http://127.0.0.1:" + server.address().port;
const overflow = [];
try {
  console.log("QA: admin");
  await page.goto(base + "/Chanray/admin/", { waitUntil: "networkidle" });
  await page.getByLabel("管理令牌", { exact: true }).fill(env.ADMIN_TOKEN);
  await page.getByRole("button", { name: "读取全站文案", exact: true }).click();
  await page.getByLabel("搜索原文或新文案", { exact: true }).waitFor();
  await page.getByLabel("搜索原文或新文案", { exact: true }).fill("调情专区");
  const row = page
    .locator("label")
    .filter({ has: page.locator("span[data-cms-exempt]").filter({ hasText: /^调情专区$/ }) })
    .locator("textarea");
  await row.fill("测试专区");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "打开草稿预览", exact: true }).click();
  const preview = await popupPromise;
  await preview.waitForLoadState("networkidle");
  await preview.getByRole("heading", { level: 1, name: "测试专区", exact: true }).waitFor();
  assert.ok(await preview.getByText("文案预览 · 尚未发布", { exact: true }).isVisible());
  assert.equal(store.has("public:site-content:v1"), false);
  await preview.getByRole("button", { name: "退出预览", exact: true }).click();
  await preview.getByRole("heading", { level: 1, name: "调情专区", exact: true }).waitFor();
  await preview.close();
  // Preview draft is separate from the live store. Remove it in the editor before checking live pages.
  await page.evaluate(() => sessionStorage.removeItem("chanray:content-preview:v1"));
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "发布修改", exact: true }).click();
  await page.getByText("文案已发布。KV 传播可能需要稍等片刻。", { exact: true }).waitFor();
  assert.equal(JSON.parse(store.get("public:site-content:v1")).overrides["调情专区"], "测试专区");
  await page.getByRole("button", { name: "导出草稿 / 备份", exact: true }).isEnabled();
  console.log("QA: comments and moderation");
  await page.goto(base + "/Chanray/works/", { waitUntil: "networkidle" });
  await page.getByLabel("昵称", { exact: true }).fill("体验访客");
  await page.getByLabel("评论内容", { exact: true }).fill("<b>作品体验</b>");
  await page.getByRole("button", { name: "提交评论", exact: true }).click();
  await page.getByText("评论已提交，审核后显示。", { exact: true }).waitFor();
  assert.equal(await page.locator("#page-comments li").count(), 0);
  await page.goto(base + "/Chanray/admin/", { waitUntil: "networkidle" });
  await page.getByLabel("管理令牌", { exact: true }).fill(env.ADMIN_TOKEN);
  await page.getByRole("button", { name: "刷新概览", exact: true }).click();
  await page.getByText("概览已更新。", { exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.querySelector("main")).getPropertyValue("--background").trim(),
    ),
    "#fff8fb",
  );
  await page.getByRole("button", { name: "读取评论", exact: true }).click();
  const commentRow = page
    .locator("#comment-management article")
    .filter({ hasText: "<b>作品体验</b>" });
  await commentRow.getByLabel("站长回复", { exact: true }).fill("谢谢留言。");
  await commentRow.getByLabel("置顶评论", { exact: true }).check();
  await commentRow.getByRole("button", { name: "公开并保存回复", exact: true }).click();
  await page.getByText("评论已更新，旧版本已备份。", { exact: true }).waitFor();
  await page.goto(base + "/Chanray/works/", { waitUntil: "networkidle" });
  await page.locator("#page-comments").getByText("<b>作品体验</b>", { exact: true }).waitFor();
  assert.equal(await page.locator("#page-comments li b").count(), 0);
  assert.ok(
    await page.locator("#page-comments").getByText("谢谢留言。", { exact: true }).isVisible(),
  );
  await page.goto(base + "/Chanray/gallery/", { waitUntil: "networkidle" });
  assert.equal(await page.locator("#page-comments li").count(), 0);
  await page.goto(base + "/Chanray/admin/", { waitUntil: "networkidle" });
  await page.getByLabel("管理令牌", { exact: true }).fill(env.ADMIN_TOKEN);
  await page.getByRole("button", { name: "读取评论", exact: true }).click();
  await commentRow.getByRole("button", { name: "移入回收站", exact: true }).click();
  await commentRow.getByRole("button", { name: "恢复为待审核", exact: true }).waitFor();
  await commentRow.getByRole("button", { name: "恢复为待审核", exact: true }).click();
  await commentRow.getByRole("button", { name: "移入回收站", exact: true }).waitFor();
  await page.goto(base + "/Chanray/", { waitUntil: "networkidle" });
  const visual = page.locator(".visual-stage canvas");
  assert.equal(await visual.evaluate((el) => getComputedStyle(el).opacity), "1");
  const before = await visual.screenshot();
  await page.getByRole("button", { name: "切换光球颜色", exact: true }).click();
  const after = await visual.screenshot();
  assert.equal(before.equals(after), false);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  assert.equal(
    await page.getByRole("button", { name: "播放", exact: true }).getAttribute("aria-pressed"),
    "true",
  );

  // Test normal public pages using real local API handlers and the published fixture.
  console.log("QA: responsive route checks");
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "",
      "works/",
      "gallery/",
      "log/",
      "contact/",
      "model/",
      "afterdark/",
      "admin/",
      "cute/index.html",
      "cute/gallery.html",
      "cute/contact.html",
      "cute/forum.html",
      "cute/chat.html",
      "cute/model.html",
    ]) {
      await page.goto(base + "/Chanray/" + route, { waitUntil: "networkidle" });
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      if (dimensions.scroll > dimensions.viewport + 1)
        overflow.push({ width, route, ...dimensions });
      if (!route.startsWith("cute/"))
        assert.equal(
          await page.getByRole("button", { name: "导航菜单", exact: true }).isVisible(),
          width < 1280,
        );
      if (route === "afterdark/")
        await page.getByRole("heading", { level: 1, name: "测试专区", exact: true }).waitFor();
    }
  }
  assert.deepEqual(overflow, []);
  // Apply broad text, metadata, accessibility attributes, and animated labels; verify source defaults aren't destroyed.
  console.log("QA: metadata and legacy");
  let current = JSON.parse(store.get("public:site-content:v1"));
  const fixture = {
    ...current.overrides,
    CHANRAY: "测试姓名",
    HOME: "首页测试",
    输入消息: "写点文字",
    锐锐: "测试角色",
    是锐锐呀: "测试站点",
    TRANSMIT: "联系测试",
    "是锐锐呀 ✿ Chanray": "旧版测试标题",
    关于锐锐: "旧版介绍测试",
  };
  await adminPost({
    request: new Request(base + "/api/admin?dataset=content", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` },
      body: JSON.stringify({
        action: "publish",
        baseRevision: current.revision,
        overrides: fixture,
      }),
    }),
    env,
  });
  await page.goto(base + "/Chanray/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1, name: "测试姓名", exact: true }).waitFor();
  assert.equal(await page.title(), "测试站点");
  await page.goto(base + "/Chanray/afterdark/", { waitUntil: "networkidle" });
  assert.equal(await page.locator("#flirt-message").getAttribute("placeholder"), "写点文字");
  await page
    .locator("button")
    .filter({ hasText: /^换一句$/ })
    .click();
  assert.ok(await page.getByRole("heading", { name: "测试专区", exact: true }).isVisible());
  await page.goto(base + "/Chanray/contact/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1, name: "联系测试", exact: true }).waitFor();
  await page.goto(base + "/Chanray/cute/index.html", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "旧版介绍测试", exact: true }).waitFor();
  assert.equal(await page.title(), "旧版测试标题");
  // Shared runtime safely handles dynamic DOM text, attributes, removal, and restoration.
  await page.evaluate(async () => {
    const { createContentTranslator } = await import("/Chanray/site-content-runtime.js");
    const container = document.createElement("div");
    container.setAttribute("data-cms-exempt", "");
    document.body.append(container);
    const inner = document.createElement("div");
    container.append(inner);
    // Test in an independent document so the site's own observer cannot transform the fixture.
    const doc = document.implementation.createHTMLDocument("fixture");
    const element = doc.createElement("p");
    element.textContent = "original";
    element.setAttribute("title", "tip");
    doc.body.append(element);
    const translator = createContentTranslator(doc, {
      original: "<img src=x onerror=alert(1)>",
      tip: "new tip",
    });
    if (
      element.querySelector("img") ||
      element.textContent !== "<img src=x onerror=alert(1)>" ||
      element.title !== "new tip"
    )
      throw new Error("unsafe replacement");
    translator.update({ original: "" });
    if (element.textContent !== "") throw new Error("blank hiding failed");
    const user = doc.createElement("p");
    user.setAttribute("data-user-content", "");
    user.textContent = "original";
    doc.body.append(user);
    translator.update({ original: "replacement" });
    if (user.textContent !== "original") throw new Error("user content was modified");
    const input = doc.createElement("input");
    input.value = "original";
    input.placeholder = "original";
    doc.body.append(input);
    translator.update({ original: "replacement" });
    if (input.value !== "original" || input.placeholder !== "replacement")
      throw new Error("form value was modified");
    translator.stop();
    if (element.textContent !== "original" || element.title !== "tip")
      throw new Error("default restore failed");
    container.remove();
  });
  // Restore the original content snapshot through the actual protected handler.
  const history = await env.BOARD.list({ prefix: "private:site-content:history:" });
  const baseline = history.keys.find(
    (key) => JSON.parse(store.get(key.name)).revision === "initial",
  );
  current = JSON.parse(store.get("public:site-content:v1"));
  const restored = await adminPost({
    request: new Request(base + "/api/admin?dataset=content", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` },
      body: JSON.stringify({
        action: "restore",
        baseRevision: current.revision,
        snapshot: baseline.name,
      }),
    }),
    env,
  });
  assert.equal(restored.status, 200);
  await page.goto(base + "/Chanray/afterdark/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "调情专区", exact: true }).waitFor();
  assert.equal(await page.getByText("BDSM：概念与边界", { exact: true }).count(), 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(screenshotDir, "05-flirt-desktop.png") });
  await page.setViewportSize({ width: 390, height: 950 });
  await page.screenshot({ path: path.join(screenshotDir, "06-flirt-mobile-current.png") });
  await page.goto(base + "/Chanray/admin/", { waitUntil: "networkidle" });
  await page.getByLabel("管理令牌", { exact: true }).fill(env.ADMIN_TOKEN);
  await page.getByRole("button", { name: "读取全站文案", exact: true }).click();
  await page.getByLabel("搜索原文或新文案", { exact: true }).waitFor();
  await page.getByLabel("搜索原文或新文案", { exact: true }).fill("调情专区");
  await page
    .locator("#content-editor-title")
    .evaluate((el) => window.scrollTo(0, scrollY + el.getBoundingClientRect().top - 100));
  await page.screenshot({ path: path.join(screenshotDir, "07-cms-mobile.png") });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(screenshotDir, "08-cms-desktop.png") });
  await page.goto(base + "/Chanray/admin/", { waitUntil: "networkidle" });
  await page.getByLabel("管理令牌", { exact: true }).fill(env.ADMIN_TOKEN);
  await page.getByRole("button", { name: "刷新概览", exact: true }).click();
  await page.getByText("概览已更新。", { exact: true }).waitFor();
  await page.getByRole("button", { name: "读取评论", exact: true }).click();
  await page.getByText("评论已读取。", { exact: true }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(screenshotDir, "09-admin-light-desktop.png") });
  await page.setViewportSize({ width: 390, height: 950 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(screenshotDir, "10-admin-light-mobile.png") });
  await page.locator("#comment-management").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(screenshotDir, "11-comments-admin-mobile.png") });
  await page.goto(base + "/Chanray/", { waitUntil: "networkidle" });
  await page.locator(".visual-stage").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(screenshotDir, "12-visual-mobile.png") });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/Chanray/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(screenshotDir, "13-visual-desktop.png") });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      result: "passed",
      viewports: [390, 768, 1440],
      routesChecked: 42,
      flows: [
        "editor",
        "draft preview",
        "publish",
        "public text",
        "metadata",
        "legacy pages",
        "restore",
        "comments moderation and recycle",
        "WebGL palette and pause",
        "light admin overview",
      ],
      browserErrors: errors,
    }),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
