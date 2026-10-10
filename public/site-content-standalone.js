import { createContentTranslator, readPreview, PREVIEW_KEY } from "./site-content-runtime.js";
const translator = createContentTranslator(document);
const draft = readPreview(sessionStorage);
async function load() {
  try {
    const url = window.CHANRAY_CONTENT_API_URL || "/api/content";
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (data.overrides && Object.values(data.overrides).every((value) => typeof value === "string"))
      translator.update(data.overrides);
  } catch {}
}
if (draft) {
  translator.update(draft);
  const notice = document.createElement("aside");
  notice.setAttribute("data-cms-exempt", "");
  notice.style.cssText =
    "position:fixed;bottom:12px;left:12px;right:12px;z-index:99999;background:#fef3c7;color:#78350f;padding:12px;border-radius:12px";
  notice.textContent = "文案预览 · 尚未发布 ";
  const exit = document.createElement("button");
  exit.textContent = "退出预览";
  exit.onclick = () => {
    sessionStorage.removeItem(PREVIEW_KEY);
    location.reload();
  };
  notice.append(exit);
  document.body.append(notice);
} else {
  void load();
  setInterval(() => {
    if (!document.hidden) void load();
  }, 60000);
}
