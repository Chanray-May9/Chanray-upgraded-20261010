/* API helpers. Every endpoint has a localStorage fallback so the site
   still works on GitHub Pages / local preview without the Cloudflare backend. */

async function req(path, opts) {
  const backend = location.hostname === "chanray-may9.github.io" ? "https://chanray-upgraded-20261010.pages.dev" : "";
  const r = await fetch(backend + path, opts);
  if (!r.ok) throw new Error("api " + r.status);
  return r.json();
}
const post = (path, data) =>
  req(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

const ls = {
  get: (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d)),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

/* ---- AI chat ---- */
export async function aiChat(messages) {
  try {
    const { reply } = await post("/api/chat", { mode: "chat", messages: messages.slice(-10) });
    return reply;
  } catch {
    return "AI 服务还没连上（预览模式）。部署到 Cloudflare 之后我就能真的陪你聊天啦 (｡•́︿•̀｡)";
  }
}

export async function aiTheme(desc) {
  return post("/api/chat", { mode: "theme", desc }); // caller handles fallback
}

/* ---- guestbook ---- */
export async function boardList() {
  try { return await req("/api/board"); } catch { return ls.get("board", []); }
}
export async function boardPost(item) {
  try { return await post("/api/board", item); }
  catch {
    const list = ls.get("board", []); list.unshift(item);
    ls.set("board", list.slice(0, 50)); return list;
  }
}

/* ---- forum ---- */
export async function forumThreads() {
  try { return await req("/api/forum"); } catch { return ls.get("forum", []); }
}
export async function forumNew(t) {
  try { return await post("/api/forum", { op: "thread", ...t }); }
  catch {
    const list = ls.get("forum", []);
    list.unshift({ ...t, id: "l" + Date.now(), t: Date.now(), replies: [] });
    ls.set("forum", list); return list;
  }
}
export async function forumReply(id, r) {
  try { return await post("/api/forum", { op: "reply", id, ...r }); }
  catch {
    const list = ls.get("forum", []);
    const th = list.find((x) => x.id === id);
    if (th) th.replies.push({ ...r, t: Date.now() });
    ls.set("forum", list); return list;
  }
}

/* ---- chat room ---- */
export async function roomFetch(since) {
  try { return await req("/api/room?since=" + (since || 0)); }
  catch { return ls.get("room", []).filter((m) => m.t > (since || 0)); }
}
export async function roomSend(msg) {
  try { return await post("/api/room", msg); }
  catch {
    const list = ls.get("room", []);
    list.push({ ...msg, t: Date.now() });
    if (/@锐锐酱/.test(msg.text))
      list.push({ name: "锐锐酱", ai: true, text: "（预览模式下我先装个睡，部署后 @ 我就真的会回话哦）", t: Date.now() + 1 });
    ls.set("room", list.slice(-100)); return list;
  }
}

/* ---- ratings ---- */
export async function rateGet() {
  try { return await req("/api/rate"); } catch { return ls.get("rates", {}); }
}
export async function ratePost(id, stars) {
  try { return await post("/api/rate", { id, stars }); }
  catch {
    const all = ls.get("rates", {});
    const r = all[id] || { sum: 0, count: 0 };
    r.sum += stars; r.count++; all[id] = r;
    ls.set("rates", all); return all;
  }
}

export const esc = (s) =>
  String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
export const fmtTime = (t) => new Date(t).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
export const myName = {
  get: () => localStorage.getItem("nick") || "",
  set: (n) => localStorage.setItem("nick", n),
};
