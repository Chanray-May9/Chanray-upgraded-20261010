import { useEffect, useRef, useState, ReactNode } from "react";
import { animate, onScroll, utils } from "animejs";

/* ============ ScrollProgress (top bar) ============ */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScrollFn = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p / 100})`;
    };
    onScrollFn();
    window.addEventListener("scroll", onScrollFn, { passive: true });
    return () => window.removeEventListener("scroll", onScrollFn);
  }, []);
  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] bg-transparent">
      <div ref={ref} className="holo h-full w-full origin-left scale-x-0 transition-transform" />
    </div>
  );
}

/* ============ TiltCard (3D hover tilt) ============ */
export function TiltCard({ children, className = "", glare = true }: { children: ReactNode; className?: string; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inner = el.querySelector<HTMLElement>("[data-tilt-inner]");
    const glareEl = el.querySelector<HTMLElement>("[data-tilt-glare]");
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rx = (0.5 - y) * 14;
      const ry = (x - 0.5) * 14;
      if (inner) inner.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      if (glareEl) {
        glareEl.style.opacity = "1";
        glareEl.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, oklch(0.95 0.1 345 / 0.45), transparent 50%)`;
      }
    };
    const onLeave = () => {
      if (inner) inner.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
      if (glareEl) glareEl.style.opacity = "0";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      <div data-tilt-inner className="relative h-full w-full transition-transform duration-200 [transform-style:preserve-3d]">
        {children}
        {glare && <div data-tilt-glare className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300" />}
      </div>
    </div>
  );
}

/* ============ ScrambleHover text ============ */
const CHARS = "アイウエオカキクケコサシスセソタチツテト01ABCDEF#@";
export function ScrambleHover({ text, className = "" }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);
  const idRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => {
    if (idRef.current) return;
    let frame = 0;
    const total = 18;
    idRef.current = setInterval(() => {
      frame++;
      const progress = frame / total;
      setOut(
        text
          .split("")
          .map((c, i) => {
            if (c === " ") return " ";
            if (i / text.length < progress) return c;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      if (frame >= total) {
        clearInterval(idRef.current!);
        idRef.current = null;
        setOut(text);
      }
    }, 30);
  };
  return (
    <span ref={ref} className={className} onMouseEnter={start}>
      {out}
    </span>
  );
}

/* ============ Reveal (scroll-triggered) ============ */
export function useScrollReveal(selector = "[data-reveal]") {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(selector);
    els.forEach((el) => {
      el.style.opacity = "0";
      animate(el, {
        opacity: [0, 1],
        y: [50, 0],
        duration: 900,
        ease: "out(4)",
        autoplay: onScroll({ target: el, enter: "bottom-=60 top" }),
      });
    });
  }, [selector]);
}

/* ============ Counter ============ */
export function useScrollCounters(selector = "[data-count]") {
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const target = parseFloat(el.dataset.count ?? "0");
      animate(el, {
        innerHTML: [0, target] as never,
        round: 1,
        duration: 1800,
        ease: "out(3)",
        autoplay: onScroll({ target: el, enter: "bottom-=40 top" }),
      });
    });
  }, [selector]);
}

/* ============ Split + stagger reveal helper ============ */
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
    animate(`${selector} span`, {
      y: [{ from: "120%", to: "0%" }],
      opacity: [{ from: 0, to: 1 }],
      rotate: [{ from: 14, to: 0 }],
      duration: 900,
      ease: "out(4)",
      delay: utils.stagger(35, { start: delay }),
    });
  }, [selector, delay]);
}

/* ============ Magnetic ============ */
export function useMagnetic(selector: string, strength = 0.3) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const cleanups: Array<() => void> = [];
    els.forEach((el) => {
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
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

/* ============ GlowOrb (canvas radial gradient orb) ============ */
export function GlowOrb({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    let t = 0;
    const loop = () => {
      t += 0.008;
      const w = c.clientWidth, h = c.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        const x = w / 2 + Math.cos(t + i * 2) * w * 0.18;
        const y = h / 2 + Math.sin(t * 1.3 + i * 2) * h * 0.18;
        const g = ctx.createRadialGradient(x, y, 0, x, y, Math.min(w, h) * 0.5);
        g.addColorStop(0, `rgba(255, ${140 + i * 30}, ${200 - i * 20}, ${0.35 - i * 0.07})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden />;
}
