export const THEME_STORAGE_KEY = "chanray:theme";
export const DEFAULT_THEME = { mode: "pink", pinkBackground: "#fff5fa", darkBackground: "#020102" };
export function applyTheme(document, mode, settings = DEFAULT_THEME) {
  const root = document.documentElement;
  const dark = mode === "dark";
  root.dataset.theme = dark ? "dark" : "pink";
  root.classList.toggle("dark", dark);
  root.style.setProperty(
    "--theme-background",
    /^#[0-9a-f]{6}$/i.test(settings[dark ? "darkBackground" : "pinkBackground"] || "")
      ? settings[dark ? "darkBackground" : "pinkBackground"]
      : DEFAULT_THEME[dark ? "darkBackground" : "pinkBackground"],
  );
}
