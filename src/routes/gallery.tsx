import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { useScrollReveal, useSplitReveal, TiltCard, GlowOrb } from "@/components/Fx";
import { SakuraRain } from "@/components/AnimeBackground";
import gal1 from "@/assets/gal-1.jpg";
import gal2 from "@/assets/gal-2.jpg";
import gal3 from "@/assets/gal-3.jpg";
import gal4 from "@/assets/gal-4.jpg";
import gal5 from "@/assets/gal-5.jpg";
import gal6 from "@/assets/gal-6.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery · Chanray" },
      { name: "description", content: "粉色科幻 / 二次元 / 机甲图像档案。" },
      { property: "og:title", content: "Gallery · Chanray" },
    ],
  }),
  component: Gallery,
});

const ITEMS = [
  { src: gal1, w: 896, h: 1280, title: "UNIT-01 · Hangar", tag: "MECHA" },
  { src: gal2, w: 1536, h: 896, title: "Neo-Pink City", tag: "SCENE" },
  { src: gal3, w: 1024, h: 1024, title: "Helmet Visor", tag: "DETAIL" },
  { src: gal4, w: 896, h: 1280, title: "Sakura Shrine", tag: "DREAM" },
  { src: gal5, w: 1536, h: 896, title: "Schematic.HOLO", tag: "BLUEPRINT" },
  { src: gal6, w: 1024, h: 1024, title: "Idol · Stage 04", tag: "PORTRAIT" },
];

function Gallery() {
  useSplitReveal("#gal-title", 100);
  useScrollReveal();
  const [open, setOpen] = useState<number | null>(null);

  // grid parallax on mouse
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const layers = el.querySelectorAll<HTMLElement>("[data-parallax]");
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l, i) => {
        const f = (i % 3) * 6 + 4;
        animate(l, { x: -x * f, y: -y * f, duration: 800, ease: "out(3)" });
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open === null) return;
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? 0 : (o + 1) % ITEMS.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? 0 : (o - 1 + ITEMS.length) % ITEMS.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <main className="relative bg-background pt-32 text-foreground">
      <section className="relative overflow-hidden border-b border-border/40 pb-16">
        <div className="absolute inset-0 bg-mecha-grid opacity-40" />
        <SakuraRain count={14} />
        <GlowOrb className="opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-primary">// 03 — GALLERY</div>
          <h1 id="gal-title" className="mt-4 font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] text-gradient text-glow">
            ARCHIVE.IMG
          </h1>
          <p data-reveal className="mt-6 max-w-2xl text-lg text-muted-foreground">
            收藏的二次元 × 机甲 × 粉色霓虹的图像信号。点击放大，← / → 切换。
          </p>
        </div>
      </section>

      <section ref={gridRef} className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {ITEMS.map((it, i) => (
            <div key={it.src} data-reveal data-parallax className="mb-5 break-inside-avoid">
              <TiltCard>
                <button
                  onClick={() => setOpen(i)}
                  className="mecha-clip group relative block w-full overflow-hidden border border-primary/30 transition-colors hover:border-primary"
                >
                  <img
                    src={it.src}
                    alt={it.title}
                    width={it.w}
                    height={it.h}
                    loading="lazy"
                    className="block h-auto w-full transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">{it.tag}</div>
                    <div className="mt-1 font-display text-lg font-bold text-foreground">{it.title}</div>
                  </div>
                  <div className="absolute right-3 top-3 mecha-clip border border-primary/50 bg-background/60 px-2 py-1 font-mono text-[10px] text-primary backdrop-blur">
                    {String(i + 1).padStart(3, "0")}
                  </div>
                </button>
              </TiltCard>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {open !== null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/90 p-6 backdrop-blur-2xl"
          onClick={() => setOpen(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? 0 : (o - 1 + ITEMS.length) % ITEMS.length)); }}
            className="btn-mecha mecha-clip absolute left-6 top-1/2 -translate-y-1/2"
            aria-label="prev"
          >←</button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? 0 : (o + 1) % ITEMS.length)); }}
            className="btn-mecha mecha-clip absolute right-6 top-1/2 -translate-y-1/2"
            aria-label="next"
          >→</button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(null); }}
            className="btn-mecha mecha-clip absolute right-6 top-6"
            aria-label="close"
          >ESC</button>

          <div className="mecha-clip relative max-h-[85vh] max-w-5xl border border-primary/60 shadow-[var(--shadow-neon)]" onClick={(e) => e.stopPropagation()}>
            <img src={ITEMS[open].src} alt={ITEMS[open].title} className="block max-h-[85vh] w-auto object-contain" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-background/80 p-4 font-mono text-xs backdrop-blur">
              <span className="text-primary">{ITEMS[open].tag}</span>
              <span className="text-foreground">{ITEMS[open].title}</span>
              <span className="text-muted-foreground">{String(open + 1).padStart(3, "0")} / {String(ITEMS.length).padStart(3, "0")}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
