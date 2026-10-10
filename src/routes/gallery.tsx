import { usePageContent } from "@/components/SiteContent";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { useScrollReveal, useSplitReveal, TiltCard, GlowOrb } from "@/components/Fx";
import { SakuraRain } from "@/components/AnimeBackground";
import photo01 from "../../photo/70d8e1f7600126b775d01129021192e0.jpg";
import photo02 from "../../photo/b9f115589a8e88d0b1dc18ea2e9c7a32.jpg";
import photo03 from "../../photo/0eb387efdbbdadbd4b14e93a7447cc51.jpg";
import photo04 from "../../photo/fd5b3e7859bc18b2c079fc68732d9d8a.jpg";
import photo05 from "../../photo/1c053df0f74cb25941e8d1955d39c128.jpg";
import photo06 from "../../photo/a746c50bbd8ddaf02dbd32a18c0ef662.jpg";
import photo07 from "../../photo/96670c4013fd6518c4fa8c09049a4c44.jpg";
import photo08 from "../../photo/a21189df6c5be0d88f886453abeeff19.jpg";
import photo09 from "../../photo/56c39aec580fb53ef85cabaae90677e7.jpg";
import photo10 from "../../photo/e7d8139ce6e03e298cb837f7a5b23562.jpg";
import photo11 from "../../photo/66dfd9d731ad3ae8524b338d0fbfaac9.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "是锐锐呀" },
      { name: "description", content: "锐锐的 AI 生成照片档案，收录随机生成的视觉照片。" },
      { property: "og:title", content: "是锐锐呀" },
    ],
  }),
  component: Gallery,
});

const ITEMS = [
  { src: photo01, w: 960, h: 1219, title: "AI PHOTO · R-01", tag: "GENERATED" },
  { src: photo02, w: 1170, h: 1164, title: "AI PHOTO · R-02", tag: "PORTRAIT" },
  { src: photo03, w: 904, h: 1215, title: "AI PHOTO · R-03", tag: "VISUAL" },
  { src: photo04, w: 1156, h: 1455, title: "AI PHOTO · R-04", tag: "DREAM" },
  { src: photo05, w: 960, h: 1219, title: "AI PHOTO · R-05", tag: "LIGHT" },
  { src: photo06, w: 1152, h: 1453, title: "AI PHOTO · R-06", tag: "FRAME" },
  { src: photo07, w: 968, h: 1218, title: "AI PHOTO · R-07", tag: "SIGNAL" },
  { src: photo08, w: 720, h: 1227, title: "AI PHOTO · R-08", tag: "MEMORY" },
  { src: photo09, w: 960, h: 1220, title: "AI PHOTO · R-09", tag: "SCENE" },
  { src: photo10, w: 960, h: 1219, title: "AI PHOTO · R-10", tag: "ARCHIVE" },
  { src: photo11, w: 1162, h: 1458, title: "AI PHOTO · R-11", tag: "MOMENT" },
];

function Gallery() {
  usePageContent();
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
      if (e.key === "ArrowLeft")
        setOpen((o) => (o === null ? 0 : (o - 1 + ITEMS.length) % ITEMS.length));
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
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-primary">
            // 03 — GALLERY
          </div>
          <h1
            id="gal-title"
            className="mt-4 font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] text-gradient text-glow"
          >
            ARCHIVE.IMG
          </h1>
          <p data-reveal className="mt-6 max-w-2xl text-lg text-muted-foreground">
            这里收录锐锐生成的一组随机 AI 照片。每一张都是独立的视觉切片，点击放大，← / → 切换。
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
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                      {it.tag}
                    </div>
                    <div className="mt-1 font-display text-lg font-bold text-foreground">
                      {it.title}
                    </div>
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
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => (o === null ? 0 : (o - 1 + ITEMS.length) % ITEMS.length));
            }}
            className="btn-mecha mecha-clip absolute left-6 top-1/2 -translate-y-1/2"
            aria-label="prev"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => (o === null ? 0 : (o + 1) % ITEMS.length));
            }}
            className="btn-mecha mecha-clip absolute right-6 top-1/2 -translate-y-1/2"
            aria-label="next"
          >
            →
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(null);
            }}
            className="btn-mecha mecha-clip absolute right-6 top-6"
            aria-label="close"
          >
            ESC
          </button>

          <div
            className="mecha-clip relative max-h-[85vh] max-w-5xl border border-primary/60 shadow-[var(--shadow-neon)]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={ITEMS[open].src}
              alt={ITEMS[open].title}
              className="block max-h-[85vh] w-auto object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-background/80 p-4 font-mono text-xs backdrop-blur">
              <span className="text-primary">{ITEMS[open].tag}</span>
              <span className="text-foreground">{ITEMS[open].title}</span>
              <span className="text-muted-foreground">
                {String(open + 1).padStart(3, "0")} / {String(ITEMS.length).padStart(3, "0")}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
