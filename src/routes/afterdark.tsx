import { AIChat } from "@/components/AIChat";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const LINES = [
  "我喜欢你，也想亲你。你愿意吗？",
  "想抱你，不是客套话。",
  "我在跟你调情。你要不要回应一下？",
  "想牵你的手，想和你接吻。",
  "我想和你约会，只有我们两个。",
  "喜欢就直说，不愿意也直说。我会尊重你的回答。",
];
export const Route = createFileRoute("/afterdark")({
  head: () => ({
    meta: [
      { title: "是锐锐呀 · 调情专区" },
      { name: "description", content: "直接说喜欢，直接聊心动。浅色调情专区与互动对白。" },
    ],
  }),
  component: AfterDark,
});
function AfterDark() {
  const [line, setLine] = useState(0);
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff5fa] px-6 pb-24 pt-36 text-[#4b2038]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl"
      />
      <div className="relative mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-[0.35em] text-pink-700">FLIRT / 调情专区</p>
        <h1 className="mt-6 font-display text-5xl font-bold leading-tight sm:text-7xl">
          我在调情。
          <br />
          <span className="text-pink-700">你接招吗？</span>
        </h1>
        <p className="mt-6 max-w-xl leading-8 text-[#75475e]">
          喜欢就说喜欢，想亲就问一句。这里不绕弯子，直接表达心动，也认真听你的回答。
        </p>
        <section
          className="mt-12 rounded-3xl border border-pink-200 bg-white/80 p-8 backdrop-blur sm:p-12"
          aria-labelledby="whisper-title"
        >
          <h2 id="whisper-title" className="text-xs tracking-[0.3em] text-pink-700">
            直接一点 / SAY IT
          </h2>
          <p className="mt-8 min-h-24 text-2xl leading-relaxed sm:text-3xl" aria-live="polite">
            {LINES[line]}
          </p>
          <button
            className="mt-8 rounded-full border border-pink-400 px-6 py-3 text-sm transition-colors hover:bg-pink-100"
            onClick={() => setLine((value) => (value + 1) % LINES.length)}
          >
            换一句调情 →
          </button>
        </section>
        <section
          className="mt-8 rounded-3xl border border-pink-200 bg-white p-6 sm:p-8"
          aria-labelledby="bdsm-title"
        >
          <h2 id="bdsm-title" className="text-2xl font-bold text-pink-700">
            BDSM：概念与边界
          </h2>
          <p className="mt-3 leading-7 text-[#75475e]">
            BDSM
            是对束缚、纪律、支配与臣服等概念的统称。了解一个标签不代表同意任何具体行为，身份也不等于义务。
          </p>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="font-bold text-pink-700">D/s · 支配与臣服</dt>
              <dd className="mt-2 leading-7 text-[#75475e]">
                双方协商的角色关系。决定权与边界必须明确，任何一方都可以撤回同意。
              </dd>
            </div>
            <div>
              <dt className="font-bold text-pink-700">安全词与停止</dt>
              <dd className="mt-2 leading-7 text-[#75475e]">
                提前约定停止信号。不必等到说出特定词语，任何拒绝、不适或犹豫都需要停下来确认。
              </dd>
            </div>
            <div>
              <dt className="font-bold text-pink-700">先谈边界</dt>
              <dd className="mt-2 leading-7 text-[#75475e]">
                成年人之间提前讨论愿意、不愿意和不确定的事。沉默、压力或醉酒不构成有效同意。
              </dd>
            </div>
            <div>
              <dt className="font-bold text-pink-700">事后沟通</dt>
              <dd className="mt-2 leading-7 text-[#75475e]">
                交流感受、关心状态，允许改变主意。关系中的尊重不会因为角色分工而消失。
              </dd>
            </div>
          </dl>
        </section>
        <AIChat />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <article className="rounded-2xl border border-pink-200 bg-white/70 p-6">
            <h2 className="text-lg text-pink-700">我想你了</h2>
            <p className="mt-3 leading-7 text-[#75475e]">
              我想收到你的消息，也想见到你本人。不是暗示，是邀请。
            </p>
          </article>
          <article className="rounded-2xl border border-pink-200 bg-white/70 p-6">
            <h2 className="text-lg text-pink-700">喜欢与边界</h2>
            <p className="mt-3 leading-7 text-[#75475e]">
              我可以直接说想亲你，你也可以直接说不。两个人都愿意，才继续靠近。
            </p>
          </article>
        </div>
      </div>
    </main>
  );
}
