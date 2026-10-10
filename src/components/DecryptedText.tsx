import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&*+!?";

interface Props {
  text: string;
  className?: string;
  speed?: number;
  trigger?: "view" | "hover" | "mount";
}

/** Decryption / scramble reveal (react-bits inspired). */
export function DecryptedText({ text, className = "", speed = 40, trigger = "view" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [out, setOut] = useState(text);
  const startedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const start = () => {
    if (startedRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    startedRef.current = true;
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i > text.length) {
        clearInterval(id);
        setOut(text);
        return;
      }
      const revealed = text.slice(0, i);
      const noise = Array.from(
        { length: Math.max(0, text.length - i) },
        () => CHARS[Math.floor(Math.random() * CHARS.length)],
      ).join("");
      setOut(revealed + noise);
    }, speed);
    timerRef.current = id;
  };

  useEffect(() => {
    if (trigger === "mount") start();
    if (trigger === "view") {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            start();
            obs.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      obs.observe(el);
      return () => obs.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      ref={ref}
      className={`font-mono ${className}`}
      onMouseEnter={trigger === "hover" ? start : undefined}
    >
      {out}
    </span>
  );
}
