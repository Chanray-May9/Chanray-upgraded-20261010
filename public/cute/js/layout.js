/* Shared chrome: nav, footer, background canvases, chat widget. */
const PAGES = [
  ["index.html", "首页"],
  ["gallery.html", "相册"],
  ["forum.html", "论坛"],
  ["chat.html", "聊天室"],
  ["model.html", "3D 模型"],
  ["contact.html", "找到我"],
];

export function mountLayout(active) {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<canvas id="bg3d"></canvas><canvas id="fx"></canvas>
    <nav id="nav">
      <a class="logo" href="index.html"><img src="photo/avatar.jpg" alt=""><span>是锐锐呀 ✿</span></a>
      <div class="links">${PAGES.map(([f, n]) =>
        `<a href="${f}" ${f === active ? 'class="on"' : ""}>${n}</a>`).join("")}
      </div>
    </nav>`
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `<footer><p>✿ 2026 · 是锐锐呀 · 手写于凌晨两点半 ✿</p>
      <p class="foot-tip"></p></footer>
    <div id="chatWidget">
      <button id="chatToggle" title="和锐锐酱聊两句"><img src="photo/avatar.jpg" alt="锐锐酱"><span class="chat-dot"></span></button>
      <div id="chatPanel">
        <div class="chat-head">🌸 锐锐酱 <small>AI 分身 · 在线</small><span id="chatClose">—</span></div>
        <div class="chat-body" id="chatBody">
          <div class="msg ai">来啦？我是锐锐酱，本体不在的时候这里我说了算 (◕‿◕✿)</div>
        </div>
        <form class="chat-input" id="chatForm">
          <input id="chatText" placeholder="说点什么…" maxlength="200" autocomplete="off">
          <button type="submit">➤</button>
        </form>
      </div>
    </div>`
  );
  initWidget();
  console.log("%c✿ 你打开了控制台？果然是同行！源码在 github.com/Chanray-May9/Chanray ✿", "color:#f4679d;font-size:14px");
}

import { aiChat } from "./api.js";

function initWidget() {
  const panel = document.querySelector("#chatPanel");
  const body = document.querySelector("#chatBody");
  document.querySelector("#chatToggle").onclick = () => panel.classList.toggle("on");
  document.querySelector("#chatClose").onclick = () => panel.classList.remove("on");
  const history = [];
  const add = (text, cls) => {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.setAttribute("data-user-content", "");
    d.textContent = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  };
  document.querySelector("#chatForm").onsubmit = async (e) => {
    e.preventDefault();
    const input = document.querySelector("#chatText");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    add(text, "me");
    history.push({ role: "user", content: text });
    const typing = add("……", "ai typing");
    const reply = await aiChat(history);
    typing.remove();
    add(reply, "ai");
    history.push({ role: "assistant", content: reply });
  };
}
