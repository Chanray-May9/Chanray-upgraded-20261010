import { createContext, useContext, useEffect, useState } from "react";
import { applyTheme, DEFAULT_THEME, THEME_STORAGE_KEY } from "../../public/site-theme-runtime.js";
type Mode = "pink" | "dark";
const ThemeContext = createContext({ mode: "pink" as Mode, toggle: () => {} });
export const useSiteTheme = () => useContext(ThemeContext);
export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("pink");
  const [settings, setSettings] = useState(DEFAULT_THEME);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "pink" || saved === "dark") {
        setMode(saved);
        applyTheme(document, saved);
      }
    } catch {}
    const load = async () => {
      let preference: string | null = null;
      try {
        preference = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {}
      let next = DEFAULT_THEME;
      try {
        const response = await fetch(import.meta.env.VITE_THEME_API_URL || "/api/theme", {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
        });
        const data = await response.json();
        if (response.ok && ["pink", "dark"].includes(data.mode)) next = data;
      } catch {}
      if (disposed) return;
      try {
        preference = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {}
      const selected: Mode =
        preference === "pink" || preference === "dark" ? preference : (next.mode as Mode);
      setSettings(next);
      setMode(selected);
      applyTheme(document, selected, next);
    };
    const visible = () => {
      if (!document.hidden) void load();
    };
    void load();
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("chanray:theme-settings", visible);
    const interval = window.setInterval(visible, 60000);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("chanray:theme-settings", visible);
    };
  }, []);
  const toggle = () => {
    const next = mode === "pink" ? "dark" : "pink";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
    setMode(next);
    applyTheme(document, next, settings);
  };
  return <ThemeContext.Provider value={{ mode, toggle }}>{children}</ThemeContext.Provider>;
}
