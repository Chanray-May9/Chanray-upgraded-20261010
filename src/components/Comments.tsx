import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
export type CommentItem = {
  id: string;
  page: string;
  name: string;
  message: string;
  createdAt: string;
  reply: string;
  pinned: boolean;
  status: string;
  revision: string;
};
export const COMMENT_PAGES = {
  home: "首页",
  works: "作品",
  gallery: "相册",
  log: "时间线",
  contact: "联系",
  model: "3D",
  afterdark: "调情专区",
};
const API = import.meta.env.VITE_COMMENTS_API_URL || "/api/comments";
export function PageComments() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const relative =
    pathname === base
      ? "/"
      : base && pathname.startsWith(base + "/")
        ? pathname.slice(base.length)
        : pathname;
  const page = relative.split("/").filter(Boolean).at(-1) || "home";
  return Object.hasOwn(COMMENT_PAGES, page) ? <Comments key={page} page={page} /> : null;
}
function Comments({ page }: { page: string }) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  function url(next?: string) {
    const url = new URL(API, location.origin);
    url.searchParams.set("page", page);
    if (next) url.searchParams.set("cursor", next);
    return url;
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch(url(), { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) })
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data.items)) throw Error();
        setItems(data.items);
        setCursor(data.cursor);
        setEnabled(data.enabled);
        setLoaded(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setNotice("评论暂时无法读取，请稍后刷新。");
      });
    return () => controller.abort();
  }, [page]);
  async function more() {
    if (busy || !cursor) return;
    setBusy(true);
    try {
      const r = await fetch(url(cursor), { signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw Error();
      const data = await r.json();
      setItems((old) => [
        ...old,
        ...data.items.filter((x: CommentItem) => !old.some((y) => y.id === x.id)),
      ]);
      setCursor(data.cursor);
    } catch {
      setNotice("读取失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const website = new FormData(event.currentTarget).get("website");
    setBusy(true);
    setNotice("正在提交…");
    try {
      const r = await fetch(url(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok)
        throw Error(
          r.status === 429
            ? "提交过于频繁，请稍后再试。"
            : r.status === 403
              ? "评论已关闭。"
              : "提交失败，请稍后重试。",
        );
      const data = await r.json();
      setMessage("");
      setNotice(data.pending ? "评论已提交，审核后显示。" : "评论已发布，稍后刷新可见。");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "提交失败。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="page-comments"
      className="mx-auto max-w-5xl px-6 py-12"
      aria-labelledby="comments-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="comments-title" className="text-2xl font-bold">
          评论
        </h2>
        <span className="text-sm text-muted-foreground">当前页面的留言</span>
      </div>
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {notice}
      </p>
      {!enabled ? (
        <p className="mt-4">评论暂时关闭。</p>
      ) : (
        <>
          <form
            onSubmit={submit}
            className="mt-5 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[12rem_1fr]"
          >
            <label className="grid gap-2 self-start text-sm">
              昵称
              <input
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-border bg-background p-3"
                autoComplete="nickname"
              />
            </label>
            <label className="grid gap-2 text-sm">
              评论内容
              <textarea
                required
                maxLength={2000}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-lg border border-border bg-background p-3"
                placeholder="写下你的想法"
              />
            </label>
            <div hidden aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">
                昵称与评论会公开展示，请勿填写私人联系方式。
              </p>
              <button
                type="submit"
                className="btn-mecha primary"
                disabled={busy || !loaded || !name.trim() || !message.trim()}
              >
                提交评论
              </button>
            </div>
          </form>
          <ul className="mt-6 space-y-4">
            {[...items]
              .sort((a, b) => Number(b.pinned) - Number(a.pinned))
              .map((item) => (
                <li key={item.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <strong data-user-content>{item.name}</strong>
                    <time dateTime={item.createdAt} className="text-xs text-muted-foreground">
                      {item.createdAt.slice(0, 10)}
                    </time>
                  </div>
                  {item.pinned && (
                    <span className="mt-2 inline-block text-xs text-primary">置顶</span>
                  )}
                  <p data-user-content className="mt-3 whitespace-pre-wrap break-words">
                    {item.message}
                  </p>
                  {item.reply && (
                    <div className="mt-4 rounded-lg bg-primary/5 p-3">
                      <span className="text-xs text-primary">站长回复</span>
                      <p data-user-content className="mt-1 whitespace-pre-wrap break-words text-sm">
                        {item.reply}
                      </p>
                    </div>
                  )}
                </li>
              ))}
          </ul>
          {loaded && items.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">暂无公开评论。</p>
          )}
          {cursor && (
            <button className="btn-mecha mt-5" disabled={busy} onClick={() => void more()}>
              查看更多评论
            </button>
          )}
        </>
      )}
    </section>
  );
}
