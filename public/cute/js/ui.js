/* Scroll reveals, counters, tilt cards. */
export function initUi() {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.querySelectorAll(".counter").forEach((el) => {
      const to = +el.dataset.to; let v = 0;
      const tick = () => { v = Math.min(to, v + Math.max(1, to / 30)); el.textContent = Math.round(v); if (v < to) requestAnimationFrame(tick); };
      tick();
    });
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  document.querySelectorAll(".tilt").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
  return io;
}

export function boot(active, page) {
  Promise.all([
    import("./layout.js"),
    import("./bg3d.js"),
    import("./fx.js"),
  ]).then(([layout, bg, fx]) => {
    layout.mountLayout(active);
    bg.initBg3d();
    fx.initFx();
    const io = initUi();
    if (page) page(io);
  });
}
