import { useEffect, useRef, useState } from "react";

const MV_SRC = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
let viewerPromise: Promise<void> | undefined;
function loadViewer() {
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (!viewerPromise) {
    viewerPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = MV_SRC;
      const timeout = window.setTimeout(() => fail(), 20_000);
      const fail = () => {
        clearTimeout(timeout);
        script.remove();
        viewerPromise = undefined;
        reject(new Error("Model viewer unavailable"));
      };
      script.onerror = fail;
      script.onload = () => {
        if (!customElements.get("model-viewer")) return fail();
        clearTimeout(timeout);
        resolve();
      };
      document.head.appendChild(script);
    });
  }
  return viewerPromise;
}

export function ModelViewer({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let disposed = false;
    let viewer: HTMLElement | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rotate = () =>
      viewer?.toggleAttribute("auto-rotate", !motion.matches && !document.hidden);
    const ready = () => setStatus("ready");
    const failed = () => setStatus("error");
    setStatus("loading");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        loadViewer()
          .then(() => {
            if (disposed) return;
            viewer = document.createElement("model-viewer");
            viewer.setAttribute("src", src);
            viewer.setAttribute("alt", "锐锐的 3D 角色模型，可拖动旋转和缩放");
            viewer.setAttribute("camera-controls", "");
            viewer.setAttribute("loading", "lazy");
            viewer.setAttribute("shadow-intensity", "1");
            viewer.setAttribute("exposure", "1.1");
            viewer.setAttribute("rotation-per-second", "24deg");
            viewer.setAttribute("interaction-prompt", "none");
            viewer.style.cssText = "width:100%;height:100%;background:transparent";
            viewer.addEventListener("load", ready);
            viewer.addEventListener("error", failed);
            rotate();
            container.appendChild(viewer);
          })
          .catch(() => {
            if (!disposed) failed();
          });
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    motion.addEventListener("change", rotate);
    document.addEventListener("visibilitychange", rotate);
    return () => {
      disposed = true;
      observer.disconnect();
      motion.removeEventListener("change", rotate);
      document.removeEventListener("visibilitychange", rotate);
      viewer?.removeEventListener("load", ready);
      viewer?.removeEventListener("error", failed);
      viewer?.remove();
    };
  }, [src, attempt]);
  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={ref} className="h-full w-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center" role="status">
          {status === "loading" ? (
            "正在加载 3D 模型…"
          ) : (
            <button className="btn-mecha" onClick={() => setAttempt((value) => value + 1)}>
              加载失败，点击重试
            </button>
          )}
        </div>
      )}
    </div>
  );
}
