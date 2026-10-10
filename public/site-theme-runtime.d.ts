export type ThemeSettings = {
  mode: "pink" | "dark";
  pinkBackground: string;
  darkBackground: string;
};
export const DEFAULT_THEME: ThemeSettings;
export const THEME_STORAGE_KEY: string;
export function applyTheme(document: Document, mode: string, settings?: ThemeSettings): void;
