import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };
const CHAT_URL = import.meta.env.VITE_CHAT_API_URL || "/api/chat";
export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function send() {
    if (busy || !input.trim()) return;
    const next: Message[] = [...messages, { role: "user" as const, content: input.trim() }].slice(
      -9,
    );
    setBusy(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 20_000);
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "flirt", messages: next }),
        signal: abort.signal,
      });
      if (!response.ok) throw new Error("AI 暂时不可用，请稍后再试。");
      const body = await response.json();
      if (typeof body.reply !== "string" || !body.reply.trim())
        throw new Error("没有收到回复，请重试。");
      setMessages([...next, { role: "assistant", content: body.reply }]);
      setInput("");
    } catch (error) {
      if (!abort.signal.aborted) setError(error instanceof Error ? error.message : "请求失败。");
      else setError("请求已超时，请重试。");
    } finally {
      clearTimeout(timeout);
      controller.current = null;
      setBusy(false);
    }
  }
  return (
    <section
      className="mt-8 rounded-3xl border border-pink-200 bg-white p-6 sm:p-8"
      aria-labelledby="ai-chat-title"
    >
      <h2 id="ai-chat-title" className="text-2xl font-bold text-pink-700">
        和锐锐聊天
      </h2>
      <p className="mt-2 text-sm text-[#75475e]">
        消息会发送给 AI 服务处理。对话只在当前页面保留。
      </p>
      <div className="mt-6 max-h-96 space-y-4 overflow-auto" role="log" aria-live="polite">
        {messages.length === 0 && <p className="rounded-2xl bg-pink-50 p-4">你好。</p>}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-2xl p-4 ${message.role === "user" ? "ml-8 bg-pink-100" : "mr-8 bg-pink-50"}`}
          >
            <p className="mb-1 text-xs text-pink-700">
              {message.role === "user" ? "主人" : "锐锐"}
            </p>
            <p data-user-content className="whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        ))}
      </div>
      <form
        className="mt-6 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <label htmlFor="flirt-message" className="text-sm">
          消息
        </label>
        <textarea
          id="flirt-message"
          className="rounded-xl border border-pink-200 bg-pink-50 p-3"
          rows={3}
          maxLength={1000}
          required
          value={input}
          disabled={busy}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入消息"
        />
        <div className="flex gap-3">
          <button
            disabled={busy || !input.trim()}
            className="rounded-full bg-pink-700 px-6 py-3 text-white disabled:opacity-50"
          >
            {busy ? "正在回复…" : "发送"}
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-full border border-pink-300 px-6 py-3"
            onClick={() => {
              setMessages([]);
              setInput("");
              setError("");
            }}
          >
            清空对话
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
