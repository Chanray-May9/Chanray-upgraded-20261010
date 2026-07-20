import { useEffect, useRef } from "react";

const MV_SRC = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";

export function ModelViewer({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.querySelector(`script[src="${MV_SRC}"]`)) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = MV_SRC;
      document.head.appendChild(s);
    }
    if (ref.current && !ref.current.firstChild) {
      ref.current.innerHTML = `<model-viewer src="${src}" camera-controls auto-rotate rotation-per-second="24deg" shadow-intensity="1" exposure="1.1" interaction-prompt="none" style="width:100%;height:100%;background:transparent"></model-viewer>`;
    }
  }, [src]);

  return <div ref={ref} className={className} />;
}
