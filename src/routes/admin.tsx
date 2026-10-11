import { AdminOverview } from "@/components/AdminOverview";
import { CommentManager } from "@/components/CommentManager";
import { usePageContent } from "@/components/SiteContent";
import { ContentEditor } from "@/components/ContentEditor";
import { AISettings } from "@/components/AISettings";
import { ThemeSettings } from "@/components/ThemeSettings";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

type RecordItem = { id: string; data: unknown };
const DATASETS = { board: "留言板", forum: "论坛帖子", room: "聊天室", rate: "照片评分" };
// For cross-origin hosting use a trusted reverse proxy; credentials never enter URL/localStorage.
const API_URL = import.meta.env.VITE_ADMIN_API_URL || "/api/admin";
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Chanray · 内容管理" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Admin,
});
function Admin() {
  usePageContent();
  const adminSite = import.meta.env.VITE_ADMIN_SITE_URL;
  useEffect(() => {
    if (adminSite && new URL(adminSite).origin !== location.origin) location.replace(adminSite);
  }, [adminSite]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  // Child controls receive only a session-ready flag, never a credential.
  const token = loggedIn ? "session" : "";
  const [dataset, setDataset] = useState<keyof typeof DATASETS>("board");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [message, setMessage] = useState("输入管理密码登录。");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const sequence = useRef(0);
  const sessionURL = API_URL.replace(/\/admin$/, "/admin-session");
  useEffect(() => {
    if (adminSite && new URL(adminSite).origin !== location.origin) return;
    const controller = new AbortController();
    const initialSequence = sequence.current;
    fetch(sessionURL, {
      credentials: "same-origin",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
    })
      .then(async (response) => {
        const session = await response.json();
        if (response.ok && session.authenticated && initialSequence === sequence.current) {
          setLoggedIn(true);
          setMessage("已登录，可以管理网站。");
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [sessionURL]);
  async function login() {
    if (busy || !password) return;
    sequence.current++;
    setBusy(true);
    try {
      const response = await fetch(sessionURL, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        signal: AbortSignal.timeout(15_000),
      });
      await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "密码不正确。"
            : response.status === 429
              ? "尝试次数较多，请稍后再试。"
              : "登录失败，请稍后再试。",
        );
      setPassword("");
      setLoggedIn(true);
      setMessage("已登录，可以管理网站。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败。");
    } finally {
      setBusy(false);
    }
  }
  async function run(id?: string) {
    if (busy || !token.trim()) return;
    if (id && !window.confirm("确认删除这条记录？删除后无法通过代码回退恢复数据。")) return;
    const current = ++sequence.current;
    setBusy(true);
    setMessage("处理中…");
    try {
      const url = new URL(API_URL, window.location.origin);
      url.searchParams.set("dataset", dataset);
      const headers = { "Content-Type": "application/json" };
      if (id) {
        const result = await fetch(url, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ id }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!result.ok)
          throw new Error(
            result.status === 409
              ? "记录已变化，请重新读取后操作。"
              : "删除失败，请检查权限或后端配置。",
          );
      }
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
      if (response.status === 401) setLoggedIn(false);
      if (!response.ok)
        throw new Error(
          response.status === 401 ? "登录已过期，请重新登录。" : "后端不可用，请稍后再试。",
        );
      const body = await response.json();
      if (!Array.isArray(body.records)) throw new Error("接口返回无效数据。");
      if (current === sequence.current) {
        setRecords(body.records);
        setLoaded(true);
        setMessage(id ? "删除成功，列表已更新。" : `已读取 ${body.records.length} 条记录。`);
      }
    } catch (error) {
      if (current === sequence.current) {
        setLoaded(false);
        setMessage(error instanceof Error ? error.message : "请求失败。");
      }
    } finally {
      if (current === sequence.current) setBusy(false);
    }
  }
  async function clear() {
    sequence.current++;
    setBusy(true);
    try {
      const response = await fetch(sessionURL, {
        method: "DELETE",
        credentials: "same-origin",
        signal: AbortSignal.timeout(15_000),
      });
      await response.json();
      if (!response.ok) throw new Error();
    } catch {
      setBusy(false);
      setMessage("退出失败，请重试。");
      return;
    }
    sequence.current++;
    setBusy(false);
    setLoggedIn(false);
    setPassword("");
    setRecords([]);
    setLoaded(false);
    setMessage("已退出管理。");
  }
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32">
      <h1 className="font-display text-3xl font-bold text-gradient">网站管理</h1>
      <p className="mt-3 text-muted-foreground">文案、评论、AI 配置与互动数据。</p>
      <nav aria-label="后台功能" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[
          ["admin-overview", "概览"],
          ["comment-management", "评论"],
          ["content-editor-title", "全站文案"],
          ["ai-settings-title", "AI 配置"],
          ["theme-settings", "主题"],
          ["legacy-data", "互动数据"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={"#" + id}
            className="rounded-full border border-border bg-card px-4 py-2 hover:border-primary"
          >
            {label}
          </a>
        ))}
      </nav>
      <form
        className="mt-8 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void (loggedIn ? run() : login());
        }}
      >
        {!loggedIn && (
          <label className="grid gap-2">
            管理密码
            <input
              className="rounded border border-border bg-card p-3"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={busy}
              onChange={(event) => {
                setPassword(event.target.value);
                setRecords([]);
                setLoaded(false);
              }}
            />
          </label>
        )}
        {loggedIn && (
          <label className="grid gap-2">
            数据分类
            <select
              className="rounded border border-border bg-card p-3"
              value={dataset}
              disabled={busy}
              onChange={(event) => {
                setDataset(event.target.value as keyof typeof DATASETS);
                setRecords([]);
                setLoaded(false);
              }}
            >
              {Object.entries(DATASETS).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button className="btn-mecha" disabled={busy || (!loggedIn && !password)} type="submit">
            {busy ? "处理中…" : loggedIn ? "读取 / 刷新" : "登录"}
          </button>
          {loggedIn && (
            <button
              className="btn-mecha"
              type="button"
              disabled={!loaded || busy}
              onClick={() => {
                const link = document.createElement("a");
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify({ dataset, records }, null, 2)], {
                    type: "application/json",
                  }),
                );
                link.href = url;
                link.download = `chanray-${dataset}-${new Date().toISOString().slice(0, 10)}.json`;
                link.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              导出当前分类备份
            </button>
          )}
          {loggedIn && (
            <button
              className="btn-mecha"
              type="button"
              disabled={busy}
              onClick={() => void clear()}
            >
              退出管理
            </button>
          )}
        </div>
      </form>
      <p role="status" className="my-6 text-sm text-muted-foreground">
        {message}
      </p>
      {loggedIn && (
        <>
          <AdminOverview key={"overview:" + token} token={token} apiURL={API_URL} />
          <CommentManager key={"comments:" + token} token={token} apiURL={API_URL} />
          <ContentEditor key={"content:" + token} token={token} apiURL={API_URL} />
          <AISettings key={token} token={token} apiURL={API_URL} />
          <ThemeSettings apiURL={API_URL} />
          <h2 id="legacy-data" className="mb-4 mt-10 text-xl font-bold">
            互动数据
          </h2>
          <ul className="space-y-4">
            {loaded &&
              records.map((record) => (
                <li key={record.id} className="rounded border border-border bg-card p-4">
                  <pre
                    data-user-content
                    className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-sm"
                  >
                    {JSON.stringify(record.data, null, 2)}
                  </pre>
                  <button
                    className="btn-mecha mt-3"
                    disabled={busy}
                    onClick={() => void run(record.id)}
                  >
                    删除记录
                  </button>
                </li>
              ))}
          </ul>
          {loaded && records.length === 0 && <p>当前分类暂无记录。</p>}
        </>
      )}
    </main>
  );
}
