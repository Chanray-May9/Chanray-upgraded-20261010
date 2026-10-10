import { useHydrated } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  createContentTranslator,
  PREVIEW_KEY,
  readPreview,
  translateText,
} from "../../public/site-content-runtime.js";
const ContentContext = createContext<Record<string, string>>({});
const API_URL = import.meta.env.VITE_CONTENT_API_URL || "/api/content";
export function useSiteText() {
  const overrides = useContext(ContentContext);
  return useCallback(<T,>(value: T): T => translateText(value, overrides), [overrides]);
}
export function usePageContent() {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.cmsReadyPath = window.location.pathname;
    window.dispatchEvent(new Event("chanray:page-ready"));
  }, [hydrated]);
}
export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const translator = createContentTranslator(document);
    const draft = readPreview(sessionStorage);
    let pending: Record<string, string> = {};
    const apply = (next: Record<string, string>) => {
      pending = next;
      if (!disposed && document.documentElement.dataset.cmsReadyPath === window.location.pathname) {
        setOverrides(next);
        translator.update(next);
      }
    };
    const ready = () => apply(pending);
    window.addEventListener("chanray:page-ready", ready);
    const load = async () => {
      try {
        const response = await fetch(API_URL, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        if (
          data.overrides &&
          !Array.isArray(data.overrides) &&
          typeof data.overrides === "object" &&
          Object.values(data.overrides).every((value) => typeof value === "string")
        )
          apply(data.overrides);
      } catch {
        /* Static hosting falls back to source defaults. */
      }
    };
    setPreview(Boolean(draft));
    if (draft) apply(draft);
    else void load();
    const visible = () => {
      if (!draft && !document.hidden) void load();
    };
    const timer = window.setInterval(visible, 60_000);
    document.addEventListener("visibilitychange", visible);
    return () => {
      disposed = true;
      controller.abort();
      window.removeEventListener("chanray:page-ready", ready);
      translator.stop();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return (
    <ContentContext.Provider value={overrides}>
      {children}
      {preview && (
        <aside
          data-cms-exempt
          className="fixed bottom-3 left-3 right-3 z-[100] flex items-center justify-between gap-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-950 shadow-lg"
        >
          <span>文案预览 · 尚未发布</span>
          <button
            className="underline"
            onClick={() => {
              sessionStorage.removeItem(PREVIEW_KEY);
              window.location.reload();
            }}
          >
            退出预览
          </button>
        </aside>
      )}
    </ContentContext.Provider>
  );
}
