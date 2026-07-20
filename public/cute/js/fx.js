/* 2D overlay fx: cursor sparkle trail + click heart bursts. Non-blocking. */
export function initFx() {
  const c = document.querySelector("#fx");
  if (!c) return;
  const ctx = c.getContext("2d");
  const parts = [];
  const resize = () => { c.width = innerWidth; c.height = innerHeight; };
  addEventListener("resize", resize);
  resize();

  const HUES = ["#ff8fb8", "#ffd6a5", "#a5d8ff", "#cdb4f6"];
  let last = 0;
  addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (now - last < 30) return;
    last = now;
    parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 1.5 - 0.3, life: 1, size: 3 + Math.random() * 4, color: HUES[(Math.random() * HUES.length) | 0], type: "star" });
  });
  addEventListener("click", (e) => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      parts.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * (1.5 + Math.random()), vy: Math.sin(a) * (1.5 + Math.random()) - 1, life: 1, size: 8 + Math.random() * 6, color: HUES[(Math.random() * HUES.length) | 0], type: "heart" });
    }
  });

  function heart(x, y, s, col, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 16, s / 16);
    ctx.globalAlpha = alpha; ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-8, -4, -4, -12, 0, -6);
    ctx.bezierCurveTo(4, -12, 8, -4, 0, 4);
    ctx.fill(); ctx.restore();
  }
  (function loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 0.02;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.type === "heart") heart(p.x, p.y, p.size, p.color, p.life);
      else {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life * 0.5, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  })();
}
