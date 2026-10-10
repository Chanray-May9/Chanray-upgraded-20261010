import { useState } from "react";
type Theme = {
  mode: "pink" | "dark";
  pinkBackground: string;
  darkBackground: string;
  revision: string;
};
export function ThemeSettings({ apiURL }: { apiURL: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(save = false) {
    setBusy(true);
    try {
      const url = new URL(apiURL, location.origin);
      url.searchParams.set("dataset", "theme");
      const response = await fetch(
        url,
        save && theme
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...theme, baseRevision: theme.revision }),
            }
          : undefined,
      );
      const body = await response.json();
      if (!response.ok) throw Error();
      setTheme(body);
      setNotice(save ? "主题已保存。" : "主题已读取。");
      if (save) window.dispatchEvent(new Event("chanray:theme-settings"));
    } catch {
      setNotice("操作失败，请重新读取后重试。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="theme-settings" className="mt-8 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-bold">网站主题</h2>
      <button className="btn-mecha mt-4" disabled={busy} onClick={() => void run()}>
        读取主题设置
      </button>
      <p role="status" className="mt-3 text-sm">
        {notice}
      </p>
      {theme && (
        <form
          className="mt-4 grid gap-4 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(true);
          }}
        >
          <label className="grid gap-2">
            默认风格
            <select
              aria-label="默认风格"
              className="rounded border border-border bg-background p-3"
              disabled={busy}
              value={theme.mode}
              onChange={(event) =>
                setTheme({ ...theme, mode: event.target.value as Theme["mode"] })
              }
            >
              <option value="pink">粉色</option>
              <option value="dark">深色</option>
            </select>
          </label>
          <label className="grid gap-2">
            粉色背景
            <input
              aria-label="粉色背景"
              className="h-12 w-full rounded border border-border p-1"
              type="color"
              disabled={busy}
              value={theme.pinkBackground}
              onChange={(event) => setTheme({ ...theme, pinkBackground: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            深色背景
            <input
              aria-label="深色背景"
              className="h-12 w-full rounded border border-border p-1"
              type="color"
              disabled={busy}
              value={theme.darkBackground}
              onChange={(event) => setTheme({ ...theme, darkBackground: event.target.value })}
            />
          </label>
          <button className="btn-mecha justify-self-start" disabled={busy}>
            保存主题
          </button>
        </form>
      )}
    </section>
  );
}
