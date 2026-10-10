import { usePageContent } from "@/components/SiteContent";
import { AIChat } from "@/components/AIChat";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const LINES = ["想你了。", "想抱抱你。", "想和你见面。", "我喜欢你。"];
export const Route = createFileRoute("/afterdark")({
  head: () => ({
    meta: [
      { title: "是锐锐呀 · 调情专区" },
      { name: "description", content: "调情专区与 AI 聊天。" },
    ],
  }),
  component: AfterDark,
});
function AfterDark() {
  usePageContent();
  const [line, setLine] = useState(0);
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff5fa] px-6 pb-24 pt-36 text-[#4b2038]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl"
      />
      <div className="relative mx-auto max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-pink-700">调情专区</h1>
        <section
          className="mt-12 rounded-3xl border border-pink-200 bg-white/80 p-8 backdrop-blur sm:p-12"
          aria-labelledby="whisper-title"
        >
          <h2 id="whisper-title" className="text-xs tracking-[0.3em] text-pink-700">
            想说的话
          </h2>
          <p className="mt-8 min-h-24 text-2xl leading-relaxed sm:text-3xl" aria-live="polite">
            {LINES[line]}
          </p>
          <button
            className="mt-8 rounded-full border border-pink-400 px-6 py-3 text-sm transition-colors hover:bg-pink-100"
            onClick={() => setLine((value) => (value + 1) % LINES.length)}
          >
            换一句
          </button>
        </section>
        <AIChat />
      </div>
    </main>
  );
}
