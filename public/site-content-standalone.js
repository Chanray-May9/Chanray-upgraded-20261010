import { createContentTranslator, readPreview, PREVIEW_KEY } from "./site-content-runtime.js";
import { applyTheme, DEFAULT_THEME, THEME_STORAGE_KEY } from "./site-theme-runtime.js";
async function loadTheme() {
  let settings = DEFAULT_THEME;
  try {
    const response = await fetch(window.CHANRAY_THEME_API_URL || (location.hostname === "chanray-may9.github.io" ? "https://chanray-upgraded-20261010.pages.dev/api/theme" : "/api/theme"), { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    if (response.ok && ["pink", "dark"].includes(data.mode)) settings = data;
  } catch {}
  let selected = settings.mode;
  try { selected = localStorage.getItem(THEME_STORAGE_KEY) || selected; } catch {}
  applyTheme(document, selected, settings);
}
void loadTheme();
window.addEventListener("chanray:theme-settings", () => void loadTheme());
setInterval(() => { if (!document.hidden) void loadTheme(); }, 60000);
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
