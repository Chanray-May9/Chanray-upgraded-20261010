import { usePageContent } from "@/components/SiteContent";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TiltCard,
  ScrambleHover,
  useScrollReveal,
  useMagnetic,
  useSplitReveal,
  GlowOrb,
} from "@/components/Fx";
import gal1 from "@/assets/gal-1.jpg";
import gal3 from "@/assets/gal-3.jpg";
import gal5 from "@/assets/gal-5.jpg";

export const Route = createFileRoute("/works")({
  head: () => ({
    meta: [
      { title: "是锐锐呀" },
      { name: "description", content: "Chanray 的项目与实验作品集。" },
      { property: "og:title", content: "是锐锐呀" },
    ],
  }),
  component: Works,
});

const PROJECTS = [
  {
    code: "PRJ-001",
    name: "PINK PROTOCOL",
    tag: "Personal Site",
    year: "2026",
    role: "Design / Frontend",
    stack: ["React", "Anime.js", "Canvas"],
    blurb: "你正在看的这个网站。一个粉色机甲风的个人协议，包含粒子场、磁吸交互与字符解密。",
    img: gal5,
    accent: "from-primary to-accent",
  },
  {
    code: "PRJ-002",
    name: "MAY9.ENGINE",
    tag: "Animation Lab",
    year: "2025",
    role: "Author",
    stack: ["TypeScript", "WebGL", "GLSL"],
    blurb: "一个用于二次元 UI 的微型动效引擎实验，专注于丝滑缓动与机甲风转场。",
    img: gal3,
    accent: "from-accent to-primary",
  },
  {
    code: "PRJ-003",
    name: "SCPQ · FEED",
    tag: "Content / Video",
    year: "2024 — now",
    role: "Creator",
    stack: ["TikTok", "Douyin", "Edit"],
    blurb: "在 TikTok 与抖音上分享 SCP / 二次元短视频。把故事做成会发光的卡片。",
    img: gal1,
    accent: "from-primary to-foreground",
  },
];

const EXPERIMENTS = [
  { name: "Mecha Cursor Trail", tech: "Canvas", year: "26" },
  { name: "Holographic Card", tech: "CSS / WebGL", year: "25" },
  { name: "Sakura Particle Sim", tech: "Canvas", year: "25" },
  { name: "Glitch Text Shader", tech: "GLSL", year: "24" },
  { name: "Anime Page Transition", tech: "Anime.js", year: "24" },
  { name: "Neon SVG Morphing", tech: "SVG", year: "23" },
];

function Works() {
  usePageContent();
  useSplitReveal("#works-title", 100);
  useMagnetic("[data-magnet]", 0.3);
  useScrollReveal();

  return (
    <main className="relative bg-background pt-32 text-foreground">
      {/* hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-20">
        <div className="absolute inset-0 bg-mecha-grid opacity-50" />
        <GlowOrb className="opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-primary">
            // 02 — WORKS
          </div>
          <h1
            id="works-title"
            className="mt-4 font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] text-gradient text-glow"
          >
            ARCHIVE
          </h1>
          <p data-reveal className="mt-6 max-w-2xl text-lg text-muted-foreground">
            一些近期建造的会发光的东西。每一个都是粉色协议的实战部署。
          </p>
        </div>
      </section>

      {/* projects */}
      <section className="relative mx-auto max-w-7xl space-y-20 px-6 py-20">
        {PROJECTS.map((p, i) => (
          <article key={p.code} data-reveal className="grid items-center gap-10 lg:grid-cols-2">
            <TiltCard className={i % 2 ? "lg:order-2" : ""}>
              <div className="mecha-clip relative aspect-[4/3] overflow-hidden border border-primary/40 shadow-[var(--shadow-deep)]">
                <img
                  src={p.img}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-1000 hover:scale-110"
                  loading="lazy"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-tr ${p.accent} opacity-25 mix-blend-overlay`}
                />
                <div className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.25em] text-primary backdrop-blur">
                  ◉ {p.code}
                </div>
                <div className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/80">
                  {p.year}
                </div>
              </div>
            </TiltCard>

            <div>
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                {p.tag}
              </div>
              <h3 className="mt-3 font-display text-4xl font-black sm:text-5xl">
                <ScrambleHover text={p.name} className="text-gradient" />
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-foreground/80">
                {p.blurb}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-y-3 font-mono text-xs">
                <dt className="text-muted-foreground">role</dt>
                <dd className="text-foreground">{p.role}</dd>
                <dt className="text-muted-foreground">stack</dt>
                <dd className="text-foreground">{p.stack.join(" · ")}</dd>
                <dt className="text-muted-foreground">year</dt>
                <dd className="text-foreground">{p.year}</dd>
              </dl>

              <div className="mt-8 flex gap-3">
                <a
                  data-magnet
                  href="https://github.com/Chanray-May9"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-mecha mecha-clip"
                >
                  <span>VIEW SOURCE</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* experiments grid */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div data-reveal className="flex items-baseline gap-6">
          <div className="font-mono text-sm text-primary">// 02.B</div>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
          <h3 className="font-display text-3xl font-bold sm:text-4xl">EXPERIMENTS</h3>
        </div>
        <ul className="mt-10 divide-y divide-border/40 border-y border-border/40">
          {EXPERIMENTS.map((e, i) => (
            <li
              key={e.name}
              data-reveal
              className="group flex items-center justify-between gap-6 px-2 py-6 transition-all hover:bg-card/40"
            >
              <div className="flex items-center gap-6">
                <span className="font-mono text-xs text-primary">
                  EXP.{String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-xl font-bold transition-transform group-hover:translate-x-2 sm:text-3xl">
                  <ScrambleHover text={e.name} />
                </span>
              </div>
              <div className="hidden font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground sm:flex sm:items-center sm:gap-6">
                <span>{e.tech}</span>
                <span className="text-primary">'{e.year}</span>
                <span className="text-primary transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16 flex justify-center">
          <Link to="/contact" data-magnet className="btn-mecha primary mecha-clip">
            想要合作？建立连接 →
          </Link>
        </div>
      </section>
    </main>
  );
}
