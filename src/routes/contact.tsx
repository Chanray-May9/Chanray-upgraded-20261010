import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { animate } from "animejs";
import {
  useScrollReveal,
  useSplitReveal,
  useMagnetic,
  ScrambleHover,
  GlowOrb,
  TiltCard,
} from "@/components/Fx";
import { DecryptedText } from "@/components/DecryptedText";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "是锐锐呀" },
      { name: "description", content: "通讯频段：GitHub / X / TikTok / 抖音 / 微信 / Mail。" },
      { property: "og:title", content: "是锐锐呀" },
    ],
  }),
  component: Contact,
});

const SOCIALS = [
  {
    label: "GitHub",
    handle: "Chanray-May9",
    href: "https://github.com/Chanray-May9",
    code: "GH-04",
    copy: "Chanray-May9",
  },
  {
    label: "X / Twitter",
    handle: "@PowersharpGuo",
    href: "https://x.com/PowersharpGuo",
    code: "X-07",
    copy: "@PowersharpGuo",
  },
  {
    label: "TikTok",
    handle: "@may9_chanray",
    href: "https://www.tiktok.com/@may9_chanray",
    code: "TT-11",
    copy: "@may9_chanray",
  },
  { label: "Douyin / 抖音", handle: "SCPQ", href: "#", code: "DY-09", copy: "SCPQ" },
  { label: "WeChat / 微信", handle: "May9-QR", href: "#", code: "WX-02", copy: "May9-QR" },
  {
    label: "E-Mail",
    handle: "gqr20080509@gmail.com",
    href: "mailto:gqr20080509@gmail.com",
    code: "ML-01",
    copy: "gqr20080509@gmail.com",
  },
];

function Contact() {
  useSplitReveal("#contact-title", 100);
  useMagnetic("[data-magnet]", 0.3);
  useScrollReveal();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, label: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      const el = e.currentTarget as HTMLElement;
      animate(el, { scale: [1, 1.1, 1], duration: 400, ease: "out(3)" });
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  useEffect(() => {
    // animate per-card border glow on viewport
  }, []);

  return (
    <main className="relative bg-background pt-32 text-foreground">
      <section className="relative overflow-hidden border-b border-border/40 pb-20">
        <div className="absolute inset-0 bg-mecha-grid opacity-50" />
        <GlowOrb className="opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-primary">
            // 05 — CONTACT
          </div>
          <h1
            id="contact-title"
            className="mt-4 font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] text-gradient text-glow"
          >
            TRANSMIT
          </h1>
          <p data-reveal className="mt-6 max-w-2xl text-lg text-muted-foreground">
            选择一个频段连接 <span className="text-primary">UNIT-may9</span>。点击卡片复制账号 /
            跳转外站。
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map((s) => (
            <TiltCard key={s.label}>
              <a
                data-reveal
                data-magnet
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="mecha-clip mecha-panel group relative block overflow-hidden p-7 transition-all hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                    CH.{s.code}
                  </div>
                  <button
                    onClick={(e) => copy(s.copy, s.label, e)}
                    className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-primary"
                  >
                    {copied === s.label ? "COPIED ✓" : "COPY"}
                  </button>
                </div>
                <div className="mt-6 font-display text-3xl font-black text-foreground">
                  <ScrambleHover text={s.label} className="text-gradient" />
                </div>
                <div className="mt-2 font-mono text-sm text-foreground/70">
                  <DecryptedText text={s.handle} trigger="view" />
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-border/40 pt-4 font-mono text-[10px] uppercase tracking-[0.25em]">
                  <span className="text-muted-foreground">signal · 100%</span>
                  <span className="flex h-2 w-12 overflow-hidden bg-muted">
                    <span className="h-full w-full origin-left animate-pulse bg-primary" />
                  </span>
                </div>
                <div className="mt-4 h-px w-0 bg-gradient-to-r from-primary via-accent to-transparent transition-all duration-700 group-hover:w-full" />
              </a>
            </TiltCard>
          ))}
        </div>

        <div
          data-reveal
          className="mecha-clip mecha-panel mt-20 grid gap-6 p-10 sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              // QUICK · MAIL
            </div>
            <div className="mt-2 font-display text-3xl font-bold">
              <ScrambleHover text="gqr20080509@gmail.com" />
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              主要联系邮箱 · 工作 / 合作优先
            </div>
          </div>
          <a
            data-magnet
            href="mailto:gqr20080509@gmail.com"
            className="btn-mecha primary mecha-clip"
          >
            SEND TRANSMISSION →
          </a>
        </div>

        <div
          data-reveal
          className="mt-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-primary"
        >
          即将上线AI分身,敬请期待！
        </div>
      </section>
    </main>
  );
}
