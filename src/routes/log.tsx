import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { animate, onScroll } from "animejs";
import { useScrollReveal, useSplitReveal, ScrambleHover, GlowOrb } from "@/components/Fx";

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "Log · Chanray" },
      { name: "description", content: "Chanray 的时间线日志：项目、灵感、想法。" },
      { property: "og:title", content: "Log · Chanray" },
    ],
  }),
  component: Log,
});

const ENTRIES = [
  { date: "2026.05", code: "0014", title: "粉色协议上线", body: "重新设计并部署个人主页，引入 anime.js 全套交互系统。" },
  { date: "2025.11", code: "0013", title: "MAY9.ENGINE", body: "开始写一个为二次元 UI 服务的微动效引擎，包含粒子、磁吸、解密文字、机甲转场。" },
  { date: "2025.06", code: "0012", title: "学习 GLSL", body: "在不写正式项目时，写一些片元着色器：粉色噪声、扫描线、辉光。" },
  { date: "2024.12", code: "0011", title: "SCPQ 突破 10k", body: "抖音账号阶段性数字目标达成，开始尝试更长形式的剪辑。" },
  { date: "2024.05", code: "0010", title: "16 岁", body: "在键盘上度过的又一年。开始相信代码、霓虹与机甲都是同一种语言。" },
  { date: "2023.09", code: "0009", title: "进入 React 世界", body: "第一次使用 TypeScript + React 写完一个真正可以部署的网站，从此回不去了。" },
  { date: "2022.04", code: "0008", title: "二次元觉醒", body: "看了太多机甲番，决定以后做的所有东西都要会发光。" },
  { date: "2008.05.09", code: "0001", title: "BOOT", body: "UNIT-may9 上线。" },
];

function Log() {
  useSplitReveal("#log-title", 100);
  useScrollReveal();

  // animate timeline line draw
  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    animate(el, {
      scaleY: [0, 1],
      duration: 2000,
      ease: "out(3)",
      autoplay: onScroll({ target: el, sync: true, enter: "bottom-=100 top", leave: "top center" }),
    });
  }, []);

  return (
    <main className="relative bg-background pt-32 text-foreground">
      <section className="relative overflow-hidden border-b border-border/40 pb-20">
        <div className="absolute inset-0 bg-mecha-grid opacity-50" />
        <GlowOrb className="opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-primary">// 04 — LOG</div>
          <h1 id="log-title" className="mt-4 font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] text-gradient text-glow">
            TIMELINE
          </h1>
          <p data-reveal className="mt-6 max-w-2xl text-lg text-muted-foreground">
            从 2008.05.09 开机到现在的日志条目。倒序排列。
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-6 py-20">
        <div className="relative">
          <div
            ref={lineRef}
            className="absolute left-[18px] top-0 h-full w-px origin-top bg-gradient-to-b from-primary via-accent to-transparent sm:left-1/2"
          />

          <ol className="space-y-12">
            {ENTRIES.map((e, i) => {
              const left = i % 2 === 0;
              return (
                <li
                  key={e.code}
                  data-reveal
                  className={`relative grid grid-cols-[40px_1fr] gap-4 sm:grid-cols-2 sm:gap-12 ${left ? "" : "sm:[&>*:first-child]:order-2"}`}
                >
                  {/* node */}
                  <div className="relative sm:hidden">
                    <Node />
                  </div>
                  <div className={`absolute left-1/2 top-2 hidden -translate-x-1/2 sm:block`}>
                    <Node />
                  </div>

                  <div className={`${left ? "sm:text-right sm:pr-12" : "sm:pl-12 sm:col-start-2"}`}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">LOG · {e.code}</div>
                    <div className="mt-1 font-display text-2xl font-bold">
                      <ScrambleHover text={e.title} className="text-gradient" />
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{e.date}</div>
                    <p className="mt-3 text-foreground/80">{e.body}</p>
                  </div>

                  {/* spacer for opposite side */}
                  <div className="hidden sm:block" />
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </main>
  );
}

function Node() {
  return (
    <span className="relative block h-4 w-4 rotate-45 border border-primary bg-background shadow-[0_0_18px_var(--neon)]">
      <span className="absolute inset-1 bg-primary" />
      <span className="absolute -inset-1 animate-ping border border-primary/50" />
    </span>
  );
}
