// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (unless disabled),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Build this site as static files for GitHub Pages.
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    pages: [
      { path: "/" },
      { path: "/works" },
      { path: "/gallery" },
      { path: "/log" },
      { path: "/contact" },
    ],
    prerender: {
      enabled: true,
    },
    server: { entry: "server" },
  },
  vite: {
    base: "/Chanray/",
  },
});
