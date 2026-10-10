/** Pause decorative work in hidden tabs and outside the viewport. */
export function observeAnimation(element: HTMLElement, draw: (time: number) => void) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  let frame = 0;
  let previous = 0;
  const loop = (time: number) => {
    if (time - previous >= 1000 / 30) {
      draw(time);
      previous = time;
    }
    frame = requestAnimationFrame(loop);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(loop);
    else if (motion.matches) draw(0);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  observer.observe(element);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  sync();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", sync);
    motion.removeEventListener("change", sync);
  };
}
