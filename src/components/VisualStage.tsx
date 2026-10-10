import { useEffect, useRef, useState } from "react";
const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
uniform vec2 resolution; uniform vec2 pointer; uniform float time; uniform float pulse; uniform float palette;
float sphere(vec3 p){return length(p)-.92 + .045*sin(p.x*7.+time*.8)*sin(p.y*6.-time*.7)*sin(p.z*7.+time*.5);}
mat2 rotation(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float scene(vec3 p){p.xz=rotation(time*.12+pointer.x*.6)*p.xz;p.yz=rotation(.32+pointer.y*.35)*p.yz;float orb=sphere(p);vec2 q=vec2(length(p.xz)-1.3,p.y);float ring=length(q)-.028;return min(orb,ring);}
vec3 normal(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));}
vec3 env(vec3 d){vec3 pink=mix(vec3(1.,.1,.46),vec3(.2,.65,1.),palette);vec3 violet=mix(vec3(.32,.16,.95),vec3(.12,1.,.65),palette);float band=pow(.5+.5*sin(d.y*9.+d.x*3.+time*.25),5.);float strip=pow(max(0.,1.-abs(d.y-.15)*5.),3.);return pink*band+violet*strip+vec3(.07,.04,.12)+vec3(.7,.83,1.)*pow(max(0.,dot(d,normalize(vec3(-.7,1.,1.)))),20.);}
void main(){vec2 uv=(gl_FragCoord.xy-.5*resolution)/min(resolution.x,resolution.y);vec3 ro=vec3(pointer.x*.22,pointer.y*.18,4.2);vec3 rd=normalize(vec3(uv,-1.55));float travel=0.;float closest=10.;bool hit=false;for(int i=0;i<72;i++){vec3 p=ro+rd*travel;float d=scene(p);closest=min(closest,abs(d));if(d<.002){hit=true;break;}travel+=d*.8;if(travel>7.)break;}
vec3 color=vec3(.025,.012,.045);float radial=length(uv);color+=mix(vec3(.24,.014,.09),vec3(.018,.12,.16),palette)*exp(-radial*2.3);float waves=sin(radial*18.-time*1.8+pointer.x*2.);color+=vec3(.08,.012,.035)*pow(max(0.,waves),10.)*exp(-radial);
if(hit){vec3 p=ro+rd*travel;vec3 n=normal(p);vec3 refl=reflect(rd,n);float fresnel=pow(1.-max(0.,dot(-rd,n)),3.);color=env(refl)*(.45+fresnel*1.3);color+=vec3(1.,.8,.95)*pow(max(0.,dot(reflect(normalize(vec3(2.,-3.,-2.)),n),-rd)),35.);color+=mix(vec3(.95,.03,.3),vec3(.1,.8,.9),palette)*fresnel*.5;}
color+=mix(vec3(.9,.045,.3),vec3(.02,.6,.8),palette)*.009/(closest+.018);float shock=exp(-pow((radial-pulse*2.2)*18.,2.))*(1.-pulse);color+=mix(vec3(1.,.12,.5),vec3(.2,1.,.8),palette)*shock*.7;float vignette=1.-smoothstep(.5,1.5,radial)*.5;color*=vignette;gl_FragColor=vec4(pow(color,vec3(.8)),1.);}`;
export function VisualStage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controls = useRef({ paused: false, palette: 0, burst: -10000 });
  const [paused, setPaused] = useState(false);
  const [palette, setPalette] = useState(0);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const node = canvas.current!;
    const gl = node.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      setFallback(true);
      return;
    }
    const shaders: WebGLShader[] = [];
    function shader(type: number, source: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, source);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(s);
        throw Error("shader failed");
      }
      shaders.push(s);
      return s;
    }
    const program = gl.createProgram()!;
    let buffer: WebGLBuffer | null = null;
    try {
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error();
    } catch {
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteProgram(program);
      setFallback(true);
      return;
    }
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(
      ["resolution", "pointer", "time", "pulse", "palette"].map((k) => [
        k,
        gl.getUniformLocation(program, k),
      ]),
    );
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let pointer = [0, 0];
    let lost = false;
    function draw(now: number, force = false) {
      if (lost) return;
      if (!force && (document.hidden || !visible || controls.current.paused || reduced.matches))
        return;
      const gap = now - last;
      last = now;
      if (!force) elapsed += Math.min(gap, 80) / 1000;
      const width = Math.max(
        1,
        Math.round(
          node.clientWidth *
            Math.min(devicePixelRatio, 1, 520 / Math.max(node.clientWidth, node.clientHeight)),
        ),
      );
      const height = Math.max(
        1,
        Math.round(
          node.clientHeight *
            Math.min(devicePixelRatio, 1, 520 / Math.max(node.clientWidth, node.clientHeight)),
        ),
      );
      if (node.width !== width || node.height !== height) {
        node.width = width;
        node.height = height;
        gl!.viewport(0, 0, width, height);
      }
      gl!.uniform2f(uniforms.resolution, width, height);
      gl!.uniform2f(uniforms.pointer, pointer[0], pointer[1]);
      gl!.uniform1f(uniforms.time, elapsed);
      gl!.uniform1f(uniforms.palette, controls.current.palette);
      gl!.uniform1f(
        uniforms.pulse,
        Math.min(1, Math.max(0, (now - controls.current.burst) / 1200)),
      );
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
    function loop(now: number) {
      if (now - last >= 33) draw(now);
      frame = requestAnimationFrame(loop);
    }
    const move = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      pointer = [
        ((e.clientX - r.left) / r.width) * 2 - 1,
        1 - ((e.clientY - r.top) / r.height) * 2,
      ];
      if (controls.current.paused || reduced.matches) draw(performance.now(), true);
    };
    const burst = () => {
      controls.current.burst = performance.now();
      draw(performance.now(), true);
    };
    const update = () => draw(performance.now(), true);
    const contextLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      setFallback(true);
    };
    const observer = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      last = performance.now();
      if (visible) draw(last, true);
    });
    observer.observe(node);
    const resize = new ResizeObserver(update);
    resize.observe(node);
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerdown", burst);
    node.addEventListener("webglcontextlost", contextLost);
    node.addEventListener("visual-update", update);
    reduced.addEventListener("change", update);
    draw(performance.now(), true);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerdown", burst);
      node.removeEventListener("webglcontextlost", contextLost);
      node.removeEventListener("visual-update", update);
      reduced.removeEventListener("change", update);
      gl.deleteBuffer(buffer);
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteProgram(program);
    };
  }, []);
  return (
    <div className="visual-stage relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-primary/20 shadow-[0_0_100px_#ec489930]">
      <div
        className="visual-fallback absolute inset-0"
        aria-hidden="true"
        style={{ filter: palette ? "hue-rotate(110deg)" : undefined }}
      >
        <div className="visual-fallback-orb" />
      </div>
      <canvas
        ref={canvas}
        className={`relative h-full w-full cursor-crosshair ${fallback ? "opacity-0" : ""}`}
        role="img"
        aria-label="随触摸与指针变化的光球"
      />
      <div className="pointer-events-none absolute left-6 top-6 font-mono text-[10px] tracking-[.3em] text-white/60">
        CHANRAY / 01
      </div>
      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/30 p-3 text-white backdrop-blur-xl">
        <span className="text-xs text-white/70">触摸光球</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="切换光球颜色"
            className="h-8 w-8 rounded-full border border-white/40 bg-gradient-to-br from-pink-400 to-cyan-300"
            onClick={() => {
              const next = 1 - palette;
              setPalette(next);
              controls.current.palette = next;
              canvas.current?.dispatchEvent(new Event("visual-update"));
            }}
          />
          <button
            type="button"
            className="rounded-lg border border-white/20 px-3 py-2 text-xs"
            aria-pressed={paused}
            onClick={() => {
              setPaused(!paused);
              controls.current.paused = !paused;
              canvas.current?.dispatchEvent(new Event("visual-update"));
            }}
          >
            {paused ? "播放" : "暂停"}
          </button>
        </div>
      </div>
    </div>
  );
}
