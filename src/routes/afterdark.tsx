import { usePageContent } from "@/components/SiteContent";
import { AIChat } from "@/components/AIChat";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const LINES = [
  "主人，今晚陪着锐锐。",
  "想被你抱紧，不想松开。",
  "过来，让锐锐靠一会儿。",
  "今晚不想一个人睡。",
];
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
    <main className="relative min-h-screen overflow-hidden bg-background px-6 pb-24 pt-36 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl"
      />
      <div className="relative mx-auto max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-primary">调情专区</h1>
        <section
          className="ambient-card mt-12 rounded-3xl border border-border bg-card/80 p-8 backdrop-blur sm:p-12"
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty("--touch-x", `${event.clientX - box.left}px`);
            event.currentTarget.style.setProperty("--touch-y", `${event.clientY - box.top}px`);
          }}
          aria-labelledby="whisper-title"
        >
          <h2 id="whisper-title" className="text-xs tracking-[0.3em] text-primary">
            想说的话
          </h2>
          <p
            key={line}
            className="whisper-reveal mt-8 min-h-24 text-2xl leading-relaxed sm:text-3xl"
            aria-live="polite"
          >
            {LINES[line]}
          </p>
          <button
            className="mt-8 rounded-full border border-primary px-6 py-3 text-sm transition-colors hover:bg-secondary"
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
