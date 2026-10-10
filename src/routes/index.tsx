import { usePageContent } from "@/components/SiteContent";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { animate, createTimeline, utils } from "animejs";
import { ParticleField, SakuraRain, MechaRings } from "@/components/AnimeBackground";
import { DecryptedText } from "@/components/DecryptedText";
import {
  useSplitReveal,
  useMagnetic,
  useScrollReveal,
  useScrollCounters,
  ScrambleHover,
  GlowOrb,
} from "@/components/Fx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "是锐锐呀" },
      { name: "description", content: "是锐锐呀，郭权锐的个人主页。" },
      { property: "og:title", content: "是锐锐呀" },
      { property: "og:description", content: "郭权锐的个人主页，记录成长、影像与连接方式。" },
    ],
  }),
  component: Home,
});

const AVATAR =
  "https://raw.githubusercontent.com/Chanray-May9/Chanray/refs/heads/main/%E5%A4%B4%E5%83%8F.jpg";

function Home() {
  usePageContent();
  useSplitReveal("#hero-name", 200);
  useSplitReveal("#hero-cn", 50);
  useMagnetic("[data-magnet]", 0.3);
  useScrollReveal();
  useScrollCounters();

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const layers = el.querySelectorAll<HTMLElement>("[data-depth]");
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth ?? "10");
        animate(l, { x: -x * d, y: -y * d, duration: 600, ease: "out(3)" });
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const tl = createTimeline({ delay: 300 });
    tl.add("#avatar-wrap", {
      scale: [0.4, 1],
      opacity: [0, 1],
      rotate: [-12, 0],
      duration: 1100,
      ease: "out(5)",
    })
      .add("#avatar-ring-1", { opacity: [0, 1], duration: 800 }, "-=600")
      .add(
        ".hero-chip",
        { y: [20, 0], opacity: [0, 1], duration: 700, delay: utils.stagger(80) },
        "-=500",
      );
  }, []);

  return (
    <div className="relative bg-background text-foreground">
      {/* HERO */}
      <section ref={heroRef} className="bg-noise relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-mecha-grid" data-depth="14" />
        <ParticleField />
        <SakuraRain />
        <div
          className="absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-primary/30 blur-[140px] float-slow"
          data-depth="30"
        />
        <div
          className="absolute -right-32 bottom-10 h-[420px] w-[420px] rounded-full bg-accent/30 blur-[120px] float-slow"
          data-depth="40"
          style={{ animationDelay: "-3s" }}
        />

        <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-32 lg:grid-cols-[1.1fr_0.9fr]">
          <div data-depth="6">
            <div className="hero-chip mb-6 inline-flex items-center gap-2 border border-primary/40 bg-card/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-primary backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_10px_var(--neon)]" />
              <DecryptedText text="SYSTEM ONLINE · UNIT-may9" trigger="mount" speed={35} />
            </div>

            <h1
              id="hero-name"
              className="font-display text-[clamp(3.5rem,11vw,9rem)] font-black leading-[0.85] tracking-tight text-gradient text-glow"
            >
              CHANRAY
            </h1>
            <h2
              id="hero-cn"
              className="mt-2 font-display text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-foreground"
            >
              郭 权 锐
            </h2>

            <p className="hero-chip mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
              一个出生于 <span className="text-primary">2008.05.09</span> 的二次元 /
              科幻迷与代码爱好者。 在屏幕的像素之间搭建会发光的机甲、会呼吸的粉色界面。
              <br />
              <span className="font-mono text-xs text-foreground/60">
                <DecryptedText text="// HOBBY: anime · synthwave · web magic" trigger="view" />
              </span>
            </p>

            <div className="hero-chip mt-10 flex flex-wrap gap-4">
              <Link to="/works" data-magnet className="btn-mecha primary mecha-clip">
                <span>查看作品</span>
                <Arrow />
              </Link>
              <Link to="/contact" data-magnet className="btn-mecha mecha-clip">
                <span>建立连接</span>
              </Link>
              <a
                data-magnet
                href="https://github.com/Chanray-May9"
                target="_blank"
                rel="noreferrer"
                className="btn-mecha mecha-clip"
              >
                <GithubIcon /> <span>GITHUB</span>
              </a>
              <a
                data-magnet
                href={import.meta.env.BASE_URL + "cute/index.html"}
                className="btn-mecha primary mecha-clip"
              >
                <span>❀ 樱花协议 · 进入新界面</span>
                <Arrow />
              </a>
              <Link to="/model" data-magnet className="btn-mecha mecha-clip">
                <span>UNIT-3D · 模型</span>
              </Link>
            </div>

            <div className="hero-chip mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-border/60 pt-6 font-mono">
              <Stat label="YEAR.BORN" value={2008} />
              <Stat label="PROJECTS" value={12} />
              <Stat label="COFFEE.ML" value={9999} />
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[520px]" data-depth="20">
            <MechaRings className="absolute inset-0" />
            <div className="absolute inset-6 ring-spin-rev">
              <MechaRings className="h-full w-full" />
            </div>
            <div
              id="avatar-ring-1"
              className="absolute inset-12 rounded-full border border-primary/40 shadow-[0_0_60px_oklch(0.78_0.18_350/0.5)_inset]"
            />
            <div
              id="avatar-wrap"
              className="absolute inset-16 overflow-hidden rounded-full border-2 border-primary/60 shadow-[var(--shadow-neon)]"
            >
              <img src={AVATAR} alt="Chanray avatar" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent mix-blend-overlay" />
            </div>

            {[
              "top-2 left-2",
              "top-2 right-2 rotate-90",
              "bottom-2 left-2 -rotate-90",
              "bottom-2 right-2 rotate-180",
            ].map((c) => (
              <svg
                key={c}
                className={`absolute ${c} h-10 w-10 text-primary`}
                viewBox="0 0 40 40"
                fill="none"
              >
                <path d="M2 14V2h12" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="6" cy="6" r="1.5" fill="currentColor" />
              </svg>
            ))}

            <FloatingTag className="left-0 top-10" text="ID · MAY9-08" />
            <FloatingTag className="right-0 top-1/3" text="MODEL · CHANRAY" />
            <FloatingTag className="left-2 bottom-12" text="STATUS · ACTIVE" />
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          <span className="glow-pulse">scroll ↓</span>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="relative overflow-hidden border-y border-border/50 bg-card/40 py-6">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap font-display text-3xl uppercase tracking-widest">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-12">
              {[
                "二次元",
                "★",
                "CHANRAY",
                "◆",
                "PINK PROTOCOL",
                "✦",
                "MECHA / NEON",
                "❀",
                "MAY9 / 2008",
                "★",
                "Powered by anime.js",
              ].map((t, i) => (
                <span key={i} className={i % 2 === 0 ? "text-gradient" : "text-foreground/40"}>
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="relative mx-auto max-w-7xl px-6 py-32">
        <SectionLabel code="01" title="CAPABILITY · 核心能力" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "FRONTEND", t: "现代前端", d: "React · TS · Tailwind · TanStack", icon: "◈" },
            { k: "MOTION", t: "动效编排", d: "anime.js · WAAPI · GSAP", icon: "✦" },
            { k: "GRAPHICS", t: "图形 / 着色", d: "Canvas · WebGL · SVG", icon: "▣" },
            { k: "DESIGN", t: "视觉设计", d: "Mecha UI · Glassmorphism", icon: "❖" },
          ].map((c) => (
            <div
              key={c.k}
              data-reveal
              className="mecha-clip mecha-panel group relative overflow-hidden p-6"
            >
              <div className="absolute -right-4 -top-4 font-display text-6xl text-primary/10 transition-all group-hover:text-primary/30">
                {c.icon}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                {c.k}
              </div>
              <div className="mt-3 font-display text-xl font-bold text-foreground">{c.t}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{c.d}</div>
              <div className="mt-6 h-px w-0 bg-gradient-to-r from-primary to-transparent transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA panel */}
      <section className="relative mx-auto max-w-7xl px-6 pb-32">
        <div data-reveal className="mecha-clip mecha-panel relative overflow-hidden p-12 sm:p-16">
          <GlowOrb className="opacity-50" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                // NEXT.SECTOR
              </div>
              <h3 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-5xl">
                <ScrambleHover text="进入更深层的协议。" className="text-gradient" />
              </h3>
              <p className="mt-3 max-w-md font-mono text-sm text-muted-foreground">
                继续探索：作品库 / 图像档案 / 时间线日志 / 通讯频段。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/works" data-magnet className="btn-mecha primary mecha-clip">
                WORKS <Arrow />
              </Link>
              <Link to="/gallery" data-magnet className="btn-mecha mecha-clip">
                GALLERY
              </Link>
              <Link to="/log" data-magnet className="btn-mecha mecha-clip">
                LOG
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ===== Bits (local) ===== */
function SectionLabel({ code, title }: { code: string; title: string }) {
  return (
    <div data-reveal className="flex items-baseline gap-6">
      <div className="font-mono text-sm text-primary">// {code}</div>
      <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
      <h3 className="font-display text-3xl font-bold tracking-wide text-foreground sm:text-5xl">
        {title}
      </h3>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div data-count={value} className="font-display text-3xl font-bold text-gradient">
        0
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
function FloatingTag({ className = "", text }: { className?: string; text: string }) {
  return (
    <div
      className={`absolute ${className} float-slow mecha-clip border border-primary/50 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary backdrop-blur`}
    >
      {text}
    </div>
  );
}
function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="square" />
    </svg>
  );
}
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2.1.1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.6-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z" />
    </svg>
  );
}
