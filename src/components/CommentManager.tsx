import { useState } from "react";
import { COMMENT_PAGES, type CommentItem } from "./Comments";
type Settings = { enabled: boolean; requireApproval: boolean; revision: string };
const STATUS: Record<string, string> = {
  pending: "待审核",
  approved: "已公开",
  hidden: "已隐藏",
  deleted: "回收站",
};
export function CommentManager({ token, apiURL }: { token: string; apiURL: string }) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [page, setPage] = useState("");
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function request(body?: unknown, next?: string) {
    const url = new URL(apiURL, location.origin);
    url.searchParams.set("dataset", "comments");
    if (page) url.searchParams.set("page", page);
    if (next) url.searchParams.set("cursor", next);
    const r = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok)
      throw Error(
        r.status === 409 ? "记录已变化，请重新读取。" : "操作失败，请检查令牌与后端配置。",
      );
    return r.json();
  }
  async function load(more = false) {
    if (busy || !token.trim()) return;
    setBusy(true);
    try {
      const data = await request(undefined, more ? cursor || undefined : undefined);
      setItems((old) =>
        more
          ? [...old, ...data.items.filter((x: CommentItem) => !old.some((y) => y.id === x.id))]
          : data.items,
      );
      setSettings(data.settings);
      setCursor(data.cursor);
      setNotice("评论已读取。");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "读取失败。");
    } finally {
      setBusy(false);
    }
  }
  async function saveSettings() {
    if (!settings || busy) return;
    setBusy(true);
    try {
      const data = await request({
        action: "settings",
        baseRevision: settings.revision,
        ...settings,
      });
      setSettings(data.settings);
      setNotice("评论设置已保存。");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  }
  async function moderate(item: CommentItem, status: string, reply: string, pinned: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const data = await request({
        action: "moderate",
        id: item.id,
        baseRevision: item.revision,
        status,
        reply,
        pinned,
      });
      setItems((old) => old.map((x) => (x.id === item.id ? data.item : x)));
      setNotice("评论已更新，旧版本已备份。");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "操作失败。");
    } finally {
      setBusy(false);
    }
  }
  const visible = items.filter(
    (x) =>
      (!filter || x.status === filter) &&
      (x.name + " " + x.message).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section
      id="comment-management"
      className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-7"
      aria-labelledby="comment-manager-title"
    >
      <h2 id="comment-manager-title" className="text-xl font-bold">
        评论管理
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        审核、回复、置顶、隐藏与回收站。评论按页面独立保存。
      </p>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-2 text-sm">
          评论页面
          <select
            value={page}
            disabled={busy}
            onChange={(e) => {
              setPage(e.target.value);
              setItems([]);
              setCursor(null);
            }}
            className="rounded-lg border border-border bg-background p-3"
          >
            <option value="">全部页面</option>
            {Object.entries(COMMENT_PAGES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn-mecha" disabled={busy || !token.trim()} onClick={() => void load()}>
          读取评论
        </button>
      </div>
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {notice}
      </p>
      {settings && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl bg-background p-4">
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                disabled={busy}
              />
              开放评论
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={settings.requireApproval}
                onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                disabled={busy}
              />
              审核后展示
            </label>
            <button className="btn-mecha" disabled={busy} onClick={() => void saveSettings()}>
              保存评论设置
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              审核状态
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-border bg-background p-3"
              >
                <option value="">全部状态</option>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              搜索昵称或评论
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-lg border border-border bg-background p-3"
              />
            </label>
          </div>
          <p className="my-4 text-xs text-muted-foreground">
            已读取 {items.length} 条，当前筛选 {visible.length} 条；有更多记录时请继续读取。
          </p>
          <button
            className="btn-mecha mb-5"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify({ settings, items }, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "chanray-comments.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            导出已读取评论
          </button>
          <div className="space-y-4">
            {visible.map((item) => (
              <CommentRow key={item.id + item.revision} item={item} busy={busy} save={moderate} />
            ))}
          </div>
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">当前筛选暂无评论。</p>
          )}
          {cursor && (
            <button className="btn-mecha mt-5" disabled={busy} onClick={() => void load(true)}>
              读取下一批评论
            </button>
          )}
        </>
      )}
    </section>
  );
}
function CommentRow({
  item,
  busy,
  save,
}: {
  item: CommentItem;
  busy: boolean;
  save: (item: CommentItem, status: string, reply: string, pinned: boolean) => Promise<void>;
}) {
  const [reply, setReply] = useState(item.reply);
  const [pinned, setPinned] = useState(item.pinned);
  return (
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <strong data-user-content>{item.name}</strong>
        <span>
          {COMMENT_PAGES[item.page as keyof typeof COMMENT_PAGES]} · {STATUS[item.status]}
        </span>
      </div>
      <p data-user-content className="my-3 whitespace-pre-wrap break-words text-sm">
        {item.message}
      </p>
      <label className="grid gap-2 text-sm">
        站长回复
        <textarea
          maxLength={2000}
          rows={2}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          disabled={busy}
          className="rounded-lg border border-border bg-card p-3"
        />
      </label>
      <label className="my-3 flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          disabled={busy}
        />
        置顶评论
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-mecha"
          disabled={busy}
          onClick={() => void save(item, "approved", reply, pinned)}
        >
          公开并保存回复
        </button>
        <button
          className="btn-mecha"
          disabled={busy}
          onClick={() => void save(item, "hidden", reply, pinned)}
        >
          隐藏
        </button>
        {item.status === "deleted" ? (
          <button
            className="btn-mecha"
            disabled={busy}
            onClick={() => void save(item, "pending", reply, pinned)}
          >
            恢复为待审核
          </button>
        ) : (
          <button
            className="btn-mecha"
            disabled={busy}
            onClick={() => void save(item, "deleted", reply, pinned)}
          >
            移入回收站
          </button>
        )}
      </div>
    </article>
  );
}
