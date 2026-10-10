import { usePageContent } from "@/components/SiteContent";
import { ContentEditor } from "@/components/ContentEditor";
import { AISettings } from "@/components/AISettings";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

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
  const [token, setToken] = useState("");
  const [dataset, setDataset] = useState<keyof typeof DATASETS>("board");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [message, setMessage] = useState("输入管理令牌后读取内容。令牌仅在当前页面内存中保存。");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const sequence = useRef(0);
  async function run(id?: string) {
    if (busy || !token.trim()) return;
    if (id && !window.confirm("确认删除这条记录？删除后无法通过代码回退恢复数据。")) return;
    const current = ++sequence.current;
    setBusy(true);
    setMessage("处理中…");
    try {
      const url = new URL(API_URL, window.location.origin);
      url.searchParams.set("dataset", dataset);
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
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
      if (!response.ok)
        throw new Error(
          response.status === 401 ? "管理令牌无效。" : "后端不可用，请检查 Cloudflare 部署和绑定。",
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
  function clear() {
    sequence.current++;
    setBusy(false);
    setToken("");
    setRecords([]);
    setLoaded(false);
    setMessage("已清除当前页面的管理令牌与内容。");
  }
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 pb-24 pt-32">
      <h1 className="font-display text-3xl font-bold text-gradient">内容管理</h1>
      <p className="mt-3 text-muted-foreground">
        管理留言、帖子、聊天室与评分。首次使用需要部署 Cloudflare API 并配置 ADMIN_TOKEN。
      </p>
      <form
        className="mt-8 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
      >
        <label className="grid gap-2">
          管理令牌
          <input
            className="rounded border border-border bg-card p-3"
            type="password"
            autoComplete="off"
            required
            value={token}
            disabled={busy}
            onChange={(event) => {
              setToken(event.target.value);
              setRecords([]);
              setLoaded(false);
            }}
          />
        </label>
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
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button className="btn-mecha" disabled={busy || !token.trim()} type="submit">
            {busy ? "处理中…" : "读取 / 刷新"}
          </button>
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
          <button className="btn-mecha" type="button" disabled={busy} onClick={clear}>
            退出管理
          </button>
        </div>
      </form>
      <p role="status" className="my-6 text-sm text-muted-foreground">
        {message}
      </p>
      <ContentEditor key={"content:" + token} token={token} apiURL={API_URL} />
      <AISettings key={token} token={token} apiURL={API_URL} />
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
    </main>
  );
}
