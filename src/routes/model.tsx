import { createFileRoute } from "@tanstack/react-router";
import { useScrollReveal, useSplitReveal } from "@/components/Fx";
import { DecryptedText } from "@/components/DecryptedText";
import { ModelViewer } from "@/components/ModelViewer";

export const Route = createFileRoute("/model")({
  head: () => ({
    meta: [
      { title: "是锐锐呀 · 3D MODEL" },
      { name: "description", content: "3D 模型展示。" },
    ],
  }),
  component: ModelPage,
});

function ModelPage() {
  useSplitReveal("#model-title", 100);
  useScrollReveal();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-mecha-grid" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-36">
        <div className="mb-4 inline-flex items-center gap-2 border border-primary/40 bg-card/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-primary backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <DecryptedText text="SECTION · 3D MODEL" trigger="mount" speed={35} />
        </div>
        <h1 id="model-title" className="font-display text-5xl font-black tracking-tight text-gradient">
          3D 模型
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          drag to rotate · scroll to zoom
        </p>

        <div data-reveal className="mecha-clip mecha-panel relative mt-10 overflow-hidden p-4">
          <div className="pointer-events-none absolute left-4 top-4 z-10 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            <span className="glow-pulse">CHARACTER.GLB</span>
          </div>
          <ModelViewer
            src={import.meta.env.BASE_URL + "character.glb"}
            className="h-[520px] w-full"
          />
        </div>
      </div>
    </div>
  );
}
