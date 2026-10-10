import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
const entries = new Map();
const clean = (value) => value.replace(/\s+/g, " ").trim();
function add(value, group, source) {
  value = clean(value);
  if (!value || value.length > 6000 || /^https?:|^mailto:|^\.\.?\//.test(value)) return;
  if (/^[-_a-z0-9:[\]!.#%/]+$/i.test(value) && value.includes("-") && !/[A-Z]/.test(value)) return;
  let entry = entries.get(value);
  if (!entry) {
    entry = { original: value, groups: [], sources: [] };
    entries.set(value, entry);
  }
  if (!entry.groups.includes(group)) entry.groups.push(group);
  if (!entry.sources.includes(source)) entry.sources.push(source);
}
const textAttributes = new Set(["alt", "title", "placeholder", "aria-label", "text", "label"]);
const props = new Set([
  "title",
  "label",
  "name",
  "text",
  "body",
  "blurb",
  "tag",
  "role",
  "tech",
  "year",
  "date",
  "handle",
  "copy",
  "k",
  "t",
  "d",
  "code",
  "content",
]);
function collectTs(file, group, code) {
  const src = ts.createSourceFile(
    file,
    code,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JS,
  );
  const visit = (node) => {
    if (ts.isJsxText(node)) add(node.text, group, file);
    if (ts.isStringLiteralLike(node)) {
      const parent = node.parent;
      const property = ts.isPropertyAssignment(parent)
        ? parent.name.getText(src).replace(/['"]/g, "")
        : "";
      const attr = ts.isJsxAttribute(parent) ? parent.name.getText(src) : "";
      const relevant =
        props.has(property) ||
        textAttributes.has(attr) ||
        /[\u3400-\u9fff]/.test(node.text) ||
        (ts.isArrayLiteralExpression(parent) && !node.text.includes("rotate-"));
      if (
        (relevant || (node.text.includes("<html") && node.text.includes("</html>"))) &&
        !ts.isImportDeclaration(parent)
      ) {
        if (node.text.includes("<") && node.text.includes(">")) collectHtml(node.text, group, file);
        else add(node.text, group, file);
      }
    }
    if (ts.isTemplateExpression(node) && node.getText(src).includes("<")) {
      const html = node
        .getText(src)
        .slice(1, -1)
        .replace(/\$\{[^}]+\}/g, "");
      collectHtml(html, group, file);
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
}
function collectHtml(html, group, file) {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) collectTs(file, group, match[1]);
  const stripped = html.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi,
    "",
  );
  for (const part of stripped.split(/<[^>]*>/g))
    if (part.trim())
      add(
        part
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"'),
        group,
        file,
      );
  for (const match of stripped.matchAll(/(?:placeholder|alt|title|aria-label|content)="([^"]*)"/g))
    if (!match[1].includes("width=")) add(match[1], group, file);
}
for (const file of fs.readdirSync("src/routes").filter((name) => name.endsWith(".tsx"))) {
  const group =
    {
      "index.tsx": "首页",
      "works.tsx": "作品",
      "gallery.tsx": "相册",
      "log.tsx": "时间线",
      "contact.tsx": "联系",
      "model.tsx": "3D",
      "afterdark.tsx": "调情专区",
      "admin.tsx": "管理后台",
      "__root.tsx": "全站与错误页",
    }[file] || file;
  collectTs("src/routes/" + file, group, fs.readFileSync("src/routes/" + file, "utf8"));
}
for (const file of [
  "SiteShell.tsx",
  "AIChat.tsx",
  "AISettings.tsx",
  "ModelViewer.tsx",
  "ContentEditor.tsx",
  "Comments.tsx",
  "CommentManager.tsx",
  "AdminOverview.tsx",
  "VisualStage.tsx",
])
  collectTs(
    "src/components/" + file,
    "通用组件",
    fs.readFileSync("src/components/" + file, "utf8"),
  );
for (const file of fs.readdirSync("public/cute").filter((name) => name.endsWith(".html")))
  collectHtml(fs.readFileSync("public/cute/" + file, "utf8"), "旧版页面", "public/cute/" + file);
for (const file of ["layout.js", "api.js", "fx.js"])
  collectTs(
    "public/cute/js/" + file,
    "旧版页面",
    fs.readFileSync("public/cute/js/" + file, "utf8"),
  );
collectTs(
  "src/lib/error-page.ts",
  "全站与错误页",
  fs.readFileSync("src/lib/error-page.ts", "utf8"),
);
const catalog = [...entries.values()].sort(
  (a, b) =>
    a.groups[0].localeCompare(b.groups[0], "zh-CN") ||
    a.original.localeCompare(b.original, "zh-CN"),
);
fs.writeFileSync("src/content/catalog.json", JSON.stringify(catalog, null, 2) + "\n");
console.log(`Catalog: ${catalog.length} editable original strings`);
