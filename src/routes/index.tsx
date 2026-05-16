import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { animate, createTimeline, utils, onScroll } from "animejs";
import {
  ParticleField,
  SakuraRain,
  MechaRings,
  useSplitReveal,
  useMagnetic,
} from "@/components/AnimeBackground";
import { DecryptedText } from "@/components/DecryptedText";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chanray · 郭权锐 — 二次元 / Mecha Pink Portfolio" },
      { name: "description", content: "Chanray (郭权锐) 的个人主页 — 粉色科幻机甲风格的二次元 portfolio。" },
      { property: "og:title", content: "Chanray · 郭权锐" },
      { property: "og:description", content: "二次元 × 粉色科幻 × 机甲 personal site." },
    ],
  }),
  component: Home,
});

const AVATAR = "https://raw.githubusercontent.com/Chanray-May9/Chanray/refs/heads/main/%E5%A4%B4%E5%83%8F.jpg";

const SOCIALS = [
  { label: "GitHub", handle: "Chanray-May9", href: "https://github.com/Chanray-May9", code: "GH-04" },
  { label: "X / Twitter", handle: "@PowersharpGuo", href: "https://x.com/PowersharpGuo", code: "X-07" },
  { label: "TikTok", handle: "@may9_chanray", href: "https://www.tiktok.com/@may9_chanray", code: "TT-11" },
  { label: "Douyin / 抖音", handle: "SCPQ", href: "#", code: "DY-09" },
  { label: "WeChat / 微信", handle: "May9-QR", href: "#", code: "WX-02" },
  { label: "E-Mail", handle: "gqr20080509@gmail.com", href: "mailto:gqr20080509@gmail.com", code: "ML-01" },
];

const SKILLS = [
  { k: "FRONTEND", v: ["React", "TypeScript", "Tailwind", "Anime.js", "WebGL"] },
  { k: "DESIGN", v: ["Mecha UI", "Glassmorphism", "Motion", "Pixel Art"] },
  { k: "TOOLING", v: ["Vite", "Bun", "Git", "Figma"] },
  { k: "INTEREST", v: ["Anime", "Sci-Fi", "Synthwave", "Coding"] },
];

function Home() {
  useSplitReveal("#hero-name", 200);
  useSplitReveal("#hero-cn", 50);
  useMagnetic("[data-magnet]", 0.3);

  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax on mouse for hero layers
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

  // Avatar entrance + breathing ring
  useEffect(() => {
    const tl = createTimeline({ delay: 300 });
    tl.add("#avatar-wrap", { scale: [0.4, 1], opacity: [0, 1], rotate: [-12, 0], duration: 1100, ease: "out(5)" })
      .add("#avatar-ring-1", { opacity: [0, 1], duration: 800 }, "-=600")
      .add(".hero-chip", { y: [20, 0], opacity: [0, 1], duration: 700, delay: utils.stagger(80) }, "-=500");
  }, []);

  // Scroll-triggered reveals
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      animate(el, {
        opacity: [0, 1],
        y: [40, 0],
        duration: 900,
        ease: "out(4)",
        autoplay: onScroll({ target: el, enter: "bottom-=80 top" }),
      });
    });
  }, []);

  // Scrolling stat counters
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count ?? "0");
      animate(el, {
        innerHTML: [0, target] as never,
        round: 1,
        duration: 1800,
        ease: "out(3)",
        autoplay: onScroll({ target: el, enter: "bottom-=40 top" }),
      });
    });
  }, []);

  return (
    <div className="relative bg-background text-foreground">
      <Header />

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="bg-noise relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-mecha-grid" data-depth="14" />
        <ParticleField />
        <SakuraRain />
        <div className="absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-primary/30 blur-[140px] float-slow" data-depth="30" />
        <div className="absolute -right-32 bottom-10 h-[420px] w-[420px] rounded-full bg-accent/30 blur-[120px] float-slow" data-depth="40" style={{ animationDelay: "-3s" }} />

        <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-32 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left — text */}
          <div data-depth="6">
            <div className="hero-chip mb-6 inline-flex items-center gap-2 border border-primary/40 bg-card/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-primary backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_10px_var(--neon)]" />
              <DecryptedText text="SYSTEM ONLINE · UNIT-may9" trigger="mount" speed={35} />
            </div>

            <h1 id="hero-name" className="font-display text-[clamp(3.5rem,11vw,9rem)] font-black leading-[0.85] tracking-tight text-gradient text-glow">
              CHANRAY
            </h1>
            <h2 id="hero-cn" className="mt-2 font-display text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-foreground">
              郭 权 锐
            </h2>

            <p className="hero-chip mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
              一个出生于 <span className="text-primary">2008.05.09</span> 的二次元 / 科幻迷与代码爱好者。
              在屏幕的像素之间搭建会发光的机甲、会呼吸的粉色界面。
              <br />
              <span className="font-mono text-xs text-foreground/60">
                <DecryptedText text="// HOBBY: anime · synthwave · web magic" trigger="view" />
              </span>
            </p>

            <div className="hero-chip mt-10 flex flex-wrap gap-4">
              <a data-magnet href="#contact" className="btn-mecha primary mecha-clip">
                <span>建立连接</span>
                <Arrow />
              </a>
              <a data-magnet href="https://github.com/Chanray-May9" target="_blank" rel="noreferrer" className="btn-mecha mecha-clip">
                <GithubIcon /> <span>GITHUB</span>
              </a>
            </div>

            <div className="hero-chip mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-border/60 pt-6 font-mono">
              <Stat label="YEAR.BORN" value={2008} />
              <Stat label="PROJECTS" value={12} />
              <Stat label="COFFEE.ML" value={9999} />
            </div>
          </div>

          {/* Right — avatar */}
          <div className="relative mx-auto aspect-square w-full max-w-[520px]" data-depth="20">
            <MechaRings className="absolute inset-0" />
            <div className="absolute inset-6 ring-spin-rev">
              <MechaRings className="h-full w-full" />
            </div>
            <div id="avatar-ring-1" className="absolute inset-12 rounded-full border border-primary/40 shadow-[0_0_60px_oklch(0.78_0.18_350/0.5)_inset]" />
            <div id="avatar-wrap" className="absolute inset-16 overflow-hidden rounded-full border-2 border-primary/60 shadow-[var(--shadow-neon)]">
              <img src={AVATAR} alt="Chanray avatar" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent mix-blend-overlay" />
            </div>

            {/* HUD corners */}
            {["top-2 left-2", "top-2 right-2 rotate-90", "bottom-2 left-2 -rotate-90", "bottom-2 right-2 rotate-180"].map((c) => (
              <svg key={c} className={`absolute ${c} h-10 w-10 text-primary`} viewBox="0 0 40 40" fill="none">
                <path d="M2 14V2h12" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="6" cy="6" r="1.5" fill="currentColor" />
              </svg>
            ))}

            {/* floating label tags */}
            <FloatingTag className="left-0 top-10" text="ID · MAY9-08" />
            <FloatingTag className="right-0 top-1/3" text="MODEL · CHANRAY" />
            <FloatingTag className="left-2 bottom-12" text="STATUS · ACTIVE" />
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          <span className="glow-pulse">scroll ↓</span>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <section className="relative overflow-hidden border-y border-border/50 bg-card/40 py-6">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap font-display text-3xl uppercase tracking-widest">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-12">
              {["二次元", "★", "CHANRAY", "◆", "PINK PROTOCOL", "✦", "MECHA / NEON", "❀", "MAY9 / 2008", "★", "Powered by anime.js"].map((t, i) => (
                <span key={i} className={i % 2 === 0 ? "text-gradient" : "text-foreground/40"}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section id="about" className="relative mx-auto max-w-7xl px-6 py-32">
        <SectionLabel code="02" title="ABOUT · 自我介绍" />
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          <div data-reveal className="mecha-clip mecha-panel col-span-2 p-10">
            <p className="text-lg leading-relaxed text-foreground/90">
              Hi，我是 <span className="text-primary font-semibold">郭权锐 / Chanray</span>。
              一个被赛博朋克霓虹与日系机甲同时击中的少年。我喜欢把代码当作粉色的金属——
              冷峻、流畅、又会在不经意间发出柔光。
            </p>
            <p className="mt-4 text-foreground/70">
              这个页面本身就是一个作品：粒子场、磁吸按钮、字符解密、缓动反弹、滚动驱动动画……
              全部由 <code className="text-primary">anime.js</code> 与
              手写 <code className="text-primary">Canvas</code> 驱动，零模板套用。
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {SKILLS.map((s) => (
                <div key={s.k} className="border border-border/60 bg-background/40 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">{s.k}</div>
                  <ul className="mt-2 space-y-1 text-sm text-foreground/80">
                    {s.v.map((x) => <li key={x}>· {x}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal className="mecha-clip mecha-panel relative overflow-hidden p-8">
            <div className="absolute inset-0 holo opacity-20" />
            <div className="relative font-mono text-xs leading-relaxed text-foreground/80">
              <div className="text-primary"># /profile.unit</div>
              <div className="mt-3">
                <Row k="name_en" v="Chanray" />
                <Row k="name_cn" v="郭权锐" />
                <Row k="dob" v="2008-05-09" />
                <Row k="role" v="Frontend / Creative Dev" />
                <Row k="weapon" v="React + Anime.js" />
                <Row k="theme" v="Pink · Mecha · Neon" />
                <Row k="status" v={<span className="text-primary">ONLINE ●</span>} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SOCIALS ============ */}
      <section id="contact" className="relative mx-auto max-w-7xl px-6 py-32">
        <SectionLabel code="03" title="CONTACT · 通讯频段" />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              data-reveal
              data-magnet
              href={s.href}
              target={s.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="group mecha-clip mecha-panel relative block overflow-hidden p-6 transition-all hover:border-primary"
            >
              <div className="flex items-start justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">CH.{s.code}</div>
                <Arrow className="text-foreground/40 transition-all group-hover:rotate-45 group-hover:text-primary" />
              </div>
              <div className="mt-6 font-display text-2xl font-bold text-foreground glitch">{s.label}</div>
              <div className="mt-1 font-mono text-sm text-foreground/60">
                <DecryptedText text={s.handle} trigger="view" />
              </div>
              <div className="mt-8 h-px w-full bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ===== Bits ===== */

function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 font-display text-sm font-bold tracking-[0.3em] text-foreground">
          <span className="inline-block h-2 w-2 rotate-45 bg-primary shadow-[0_0_10px_var(--neon)]" />
          MAY9 // CHANRAY
        </div>
        <nav className="hidden gap-8 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground sm:flex">
          <a href="#about" className="hover:text-primary">01·about</a>
          <a href="#contact" className="hover:text-primary">02·contact</a>
          <a href="https://github.com/Chanray-May9" target="_blank" rel="noreferrer" className="hover:text-primary">03·github↗</a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative mt-20 border-t border-border/50 bg-card/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 font-mono text-xs text-muted-foreground sm:flex-row">
        <div>© 2008.05.09 — ∞ · CHANRAY UNIT</div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          built with anime.js · react · pink protocol
        </div>
      </div>
    </footer>
  );
}

function SectionLabel({ code, title }: { code: string; title: string }) {
  return (
    <div data-reveal className="flex items-baseline gap-6">
      <div className="font-mono text-sm text-primary">// {code}</div>
      <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
      <h3 className="font-display text-3xl font-bold tracking-wide text-foreground sm:text-5xl">{title}</h3>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div data-count={value} className="font-display text-3xl font-bold text-gradient">0</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border/40 py-1.5">
      <span className="w-24 text-foreground/40">{k}</span>
      <span className="flex-1 text-foreground">{v}</span>
    </div>
  );
}

function FloatingTag({ className = "", text }: { className?: string; text: string }) {
  return (
    <div className={`absolute ${className} float-slow mecha-clip border border-primary/50 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary backdrop-blur`}>
      {text}
    </div>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2">
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
