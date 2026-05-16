import { useEffect, useRef } from "react";
import { animate, createTimeline, utils } from "animejs";

/** Canvas particle field — pink dust + connecting mecha lines. */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let pts: P[] = [];

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(120, Math.floor((w * h) / 14000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.6 + 0.2,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let mx = w / 2, my = h / 2;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left; my = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", onMove);

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mx, dy = p.y - my;
        const d = Math.hypot(dx, dy);
        if (d < 140) {
          p.x += (dx / d) * 0.6;
          p.y += (dy / d) * 0.6;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 180, 220, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // connecting lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 110) {
            ctx.strokeStyle = `rgba(255, 140, 200, ${(1 - d / 110) * 0.18})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

/** Sakura petals drifting down. */
export function SakuraRain({ count = 18 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const dur = 10 + Math.random() * 12;
        const delay = -Math.random() * dur;
        const size = 8 + Math.random() * 14;
        const dx = (Math.random() - 0.5) * 240;
        return (
          <span
            key={i}
            className="petal absolute block"
            style={{
              left: `${left}%`,
              width: size, height: size,
              ["--dur" as never]: `${dur}s`,
              ["--delay" as never]: `${delay}s`,
              ["--dx" as never]: `${dx}px`,
            }}
          >
            <svg viewBox="0 0 24 24" className="h-full w-full">
              <path
                d="M12 2c2 4 6 5 9 6-3 1-7 2-9 6-2-4-6-5-9-6 3-1 7-2 9-6z"
                fill="oklch(0.88 0.14 350)"
                opacity="0.85"
              />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

/** Floating mecha-style rotating ring SVG. */
export function MechaRings({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <svg viewBox="0 0 400 400" className="ring-spin h-full w-full">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.85 0.2 350)" />
            <stop offset="1" stopColor="oklch(0.6 0.2 340)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="180" fill="none" stroke="url(#g1)" strokeWidth="1" strokeDasharray="2 8" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="oklch(0.78 0.18 350 / 0.4)" strokeWidth="0.6" strokeDasharray="40 4 2 4" />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="198" y="14" width="4" height="14" fill="oklch(0.85 0.2 345)"
            transform={`rotate(${i * 30} 200 200)`} opacity="0.6" />
        ))}
      </svg>
    </div>
  );
}

/** Anime.js "split-text" reveal for headings. */
export function useSplitReveal(selector: string, delay = 0) {
  useEffect(() => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    const text = el.textContent ?? "";
    el.setAttribute("aria-label", text);
    el.innerHTML = text
      .split("")
      .map((ch) =>
        ch === " "
          ? `<span class="inline-block w-[0.3em]">&nbsp;</span>`
          : `<span class="inline-block will-change-transform">${ch}</span>`
      )
      .join("");
    const tl = createTimeline({ delay });
    tl.add(`${selector} span`, {
      y: [{ from: "120%", to: "0%" }],
      opacity: [{ from: 0, to: 1 }],
      rotate: [{ from: 14, to: 0 }],
      duration: 900,
      ease: "out(4)",
      delay: utils.stagger(35),
    });
  }, [selector, delay]);
}

/** Magnetic attract for buttons/icons. */
export function useMagnetic(selector: string, strength = 0.35) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const cleanups: Array<() => void> = [];
    els.forEach((el) => {
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        animate(el, { x: x * strength, y: y * strength, duration: 400, ease: "out(3)" });
      };
      const onLeave = () => animate(el, { x: 0, y: 0, duration: 600, ease: "out(5)" });
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [selector, strength]);
}
