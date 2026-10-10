import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScrollProgress } from "./Fx";

const NAV = [
  { to: "/", label: "HOME", code: "01" },
  { to: "/works", label: "WORKS", code: "02" },
  { to: "/gallery", label: "GALLERY", code: "03" },
  { to: "/log", label: "LOG", code: "04" },
  { to: "/contact", label: "CONTACT", code: "05" },
  { to: "/model", label: "3D", code: "06" },
  { to: "/afterdark", label: "调情", code: "07" },
] as const;

export function SiteHeader() {
  const { location } = useRouterState();
  const light = /\/afterdark\/?$/.test(location.pathname);
  const [now, setNow] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNow(
        d.toLocaleTimeString("en-GB", { hour12: false }) + " · " + d.toISOString().slice(0, 10),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <ScrollProgress />
      <header
        style={
          light
            ? ({
                "--foreground": "#4b2038",
                "--muted-foreground": "#75475e",
                "--primary": "#be185d",
                "--background": "#fff5fa",
                "--border": "#fbcfe8",
              } as React.CSSProperties)
            : undefined
        }
        className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/40 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex min-w-0 max-w-[60vw] items-center gap-3 font-display text-sm font-bold tracking-[0.3em] text-foreground"
          >
            <span className="relative inline-block h-2 w-2 rotate-45 bg-primary shadow-[0_0_10px_var(--neon)]">
              <span className="absolute inset-0 animate-ping bg-primary" />
            </span>
            <span className="truncate">MAY9 // CHANRAY</span>
          </Link>

          <nav className="hidden gap-4 font-mono text-[11px] uppercase tracking-[0.25em] xl:flex">
            {NAV.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`group relative flex items-center gap-1 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-primary/70">{n.code}</span>
                  <span className="max-w-[7rem] truncate">{n.label}</span>
                  <span
                    className={`absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground 2xl:block">
            <span className="text-primary">●</span> {now || "boot..."}
          </div>

          <button
            className="rounded-full border border-primary/40 bg-background/60 px-3 py-2 text-primary xl:!hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="导航菜单"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <span className="font-display text-[10px]">{open ? "X" : "≡"}</span>
          </button>
        </div>

        {open && (
          <div className="xl:hidden">
            <nav
              id="mobile-navigation"
              className="flex flex-col gap-1 border-t border-border/50 bg-background/95 px-6 py-4 font-mono text-xs uppercase tracking-[0.2em]"
            >
              {NAV.map((n) => {
                const active = location.pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 py-2 ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <span className="text-primary/60">{n.code}</span> {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-border/50 bg-card/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <div className="font-display text-lg font-bold text-gradient">CHANRAY // 郭权锐</div>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            // Pink Protocol · Mecha Frontend · 2008.05.09
          </p>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            NAVIGATE
          </div>
          <ul className="mt-3 space-y-1 font-mono text-xs">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-muted-foreground hover:text-primary">
                  → {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            SIGNAL
          </div>
          <ul className="mt-3 space-y-1 font-mono text-xs">
            <li>
              <a
                className="text-muted-foreground hover:text-primary"
                href="https://github.com/Chanray-May9"
                target="_blank"
                rel="noreferrer"
              >
                github · Chanray-May9
              </a>
            </li>
            <li>
              <a
                className="text-muted-foreground hover:text-primary"
                href="https://x.com/PowersharpGuo"
                target="_blank"
                rel="noreferrer"
              >
                x · @PowersharpGuo
              </a>
            </li>
            <li>
              <a
                className="text-muted-foreground hover:text-primary"
                href="mailto:gqr20080509@gmail.com"
              >
                mail · gqr20080509@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground xl:flex-row">
          <div>© 2008.05.09 — ∞ · CHANRAY UNIT</div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            built with anime.js · react · pink protocol
          </div>
        </div>
      </div>
    </footer>
  );
}
