import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { animate, onScroll } from "animejs";
import { useScrollReveal, useSplitReveal, ScrambleHover, GlowOrb } from "@/components/Fx";

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "是锐锐呀" },
      { name: "description", content: "郭权锐的成长与求学时间线。" },
      { property: "og:title", content: "是锐锐呀" },
    ],
  }),
  component: Log,
});

const ENTRIES = [
  {
    date: "2029.09.01",
    code: "0008",
    title: "新的坐标 · 重庆科技大学",
    body: "计划进入重庆科技大学继续向前，把下一段学习和成长写进更大的地图。",
  },
  {
    date: "2026.09.01",
    code: "0007",
    title: "建工新程",
    body: "即将进入重庆建筑工程职业学院，让新的专业方向和校园生活正式启动。",
  },
  {
    date: "2026.03.22",
    code: "0006",
    title: "单招节点达成",
    body: "完成普通高校招生高职分类考试，为下一阶段的升学路线按下确认键。",
  },
  {
    date: "2023.09.01",
    code: "0005",
    title: "长二中信号接入",
    body: "进入长寿二中，在新的课堂、节奏和同伴关系里继续积累能量。",
  },
  {
    date: "2020.09.01",
    code: "0004",
    title: "松树桥阶段开启",
    body: "进入渝北区松树桥中学校，青春的第一段长线任务从这里展开。",
  },
  {
    date: "2014.09.01",
    code: "0003",
    title: "新牌坊初启航",
    body: "进入重庆新牌坊小学校，开始把世界一点点写进自己的坐标系。",
  },
  {
    date: "2011.09.01",
    code: "0002",
    title: "汇景台第一站",
    body: "走进汇景台幼儿园，人生里的第一批朋友、游戏和好奇心开始发光。",
  },
  {
    date: "2008.05.09",
    code: "0001",
    title: "锐锐上线",
    body: "这一天，属于郭权锐的故事正式开始。",
  },
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
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-primary">
            // 04 — LOG
          </div>
          <h1
            id="log-title"
            className="mt-4 font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] text-gradient text-glow"
          >
            TIMELINE
          </h1>
          <p data-reveal className="mt-6 max-w-2xl text-lg text-muted-foreground">
            从出生到求学，再到未来计划的时间坐标。由下至上，记录锐锐一路走来的关键节点。
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
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                      LOG · {e.code}
                    </div>
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
