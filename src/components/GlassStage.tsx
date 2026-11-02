"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { GlassRenderConfig, GlassRenderer } from "@/lib/openglassui/GlassRenderer.js";
import { publishShaderStatus } from "@/lib/openglassui/shaderStatus";

type Point = { x: number; y: number };
type DisplayState = "idle" | "loading" | "ready" | "fallback";
const radiusFor = (w: number, h: number) => Math.min(w * 0.23, h * 0.38);

/** Canvas background: a scene that exists *behind* the lens, never a texture
 * painted onto the glass itself. This is uploaded only when the user opts in. */
function drawScene(canvas: HTMLCanvasElement, width: number, height: number, dpr: number) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const fill = ctx.createLinearGradient(0, 0, width, height);
  fill.addColorStop(0, "#dbe7f2"); fill.addColorStop(.57, "#aec6dc"); fill.addColorStop(1, "#d4d8ee");
  ctx.fillStyle = fill; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(41,67,109,.20)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 25) { ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,height); }
  for (let y = 0; y <= height; y += 25) { ctx.moveTo(0,y+.5);ctx.lineTo(width,y+.5); }
  ctx.stroke();
  ctx.save();
  ctx.translate(width*.5,height*.51); ctx.rotate(-.13);
  ctx.textAlign = "center";
  ctx.fillStyle = "#263d5b";
  ctx.font = `900 ${Math.min(84,width*.16)}px Arial, sans-serif`;
  ctx.fillText("REFRACT",0,4);
  ctx.font = `700 ${Math.min(15,width*.036)}px ui-monospace,monospace`;
  ctx.fillStyle = "#526982";
  ctx.fillText("LIGHT  /  SPACE  /  MATERIAL",0,34);
  ctx.restore();
  ctx.strokeStyle = "rgba(63,92,135,.36)";
  ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.arc(width*.8,height*.27,22,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle = "#405d83";ctx.font = "11px ui-monospace,monospace";
  ctx.fillText("01 / OPTICAL TEST",16,22);
}

/**
 * Default: zero shader imports, zero WebGL contexts, zero pixel readbacks.
 * A CSS glass lens composites live DOM behind it. Clicking the opt-in button
 * loads the original OpenGlassUI GPU engine, at capped resolution, with
 * parallel compilation. Unsupported GPUs keep the responsive CSS demo.
 */
export function GlassStage({ config }: { config: GlassRenderConfig }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GlassRenderer | null>(null);
  const sceneRef = useRef<HTMLCanvasElement | null>(null);
  const configRef = useRef(config);
  const pointRef = useRef<Point>({ x: 0, y: 0 });
  const sizeRef = useRef({ width: 0, height: 0 });
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const pendingRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const visibleRef = useRef(false);
  const readyReportedRef = useRef(false);
  const [phase, setPhase] = useState<DisplayState>("idle");
  const [explanation, setExplanation] = useState("");
  const [lens, setLens] = useState({ x: 50, y: 50, diameter: 160 });

  const updateLens = useCallback((x: number, y: number) => {
    const { width, height } = sizeRef.current;
    if (!width || !height) return;
    const r = radiusFor(width, height);
    const cx = Math.max(r + 3, Math.min(width - r - 3, x));
    const cy = Math.max(r + 3, Math.min(height - r - 3, y));
    pointRef.current = { x: cx, y: cy };
    // Move the optical overlay without a React re-render per pointer event.
    // The WebGL renderer consumes the same updated center on the next rAF.
    boxRef.current?.style.setProperty("--lens-x", `${cx}px`);
    boxRef.current?.style.setProperty("--lens-y", `${cy}px`);
  }, []);

  const draw = useCallback(() => {
    if (pendingRef.current || !rendererRef.current || !visibleRef.current) return;
    // One draw per display refresh, with no artificial 10 FPS limiter.
    // Slider / drag events coalesce into a single requestAnimationFrame.
    pendingRef.current = window.requestAnimationFrame(() => {
      pendingRef.current = 0;
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer || !visibleRef.current) return;
      const { width, height } = sizeRef.current;
      if (width < 5 || height < 5) return;
      try {
        // Render at screen-appropriate quality. The previous 0.8 DPR / 90k
        // pixel cap made the lens look missing on large, high-DPI screens.
        // This is a resolution ceiling, NOT a frame-rate throttle.
        const dpr = Math.max(0.75, Math.min(window.devicePixelRatio || 1, 1.5,
          Math.sqrt(750_000 / (width * height))));
        const pxW = Math.max(2, Math.round(width * dpr));
        const pxH = Math.max(2, Math.round(height * dpr));
        if (canvas.width !== pxW || canvas.height !== pxH || !sceneRef.current) {
          canvas.width = pxW; canvas.height = pxH;
          const scene = document.createElement("canvas");
          scene.width = pxW; scene.height = pxH;
          drawScene(scene, width, height, dpr);
          sceneRef.current = scene;
          renderer.upload(0, scene);
        }
        renderer.render({
          width, height, pixelRatio: dpr,
          center: pointRef.current,
          radius: radiusFor(width, height),
          config: {
            ...configRef.current,
            // Preserve actual slider/preset material settings and optical quality.
            antiAlias: 2,
            dialEnabled: false,
            clockOpacity: 0,
            glassOnly: false,
            environmentEnabled: true,
            environmentRefraction: true,
          },
        });
        canvas.style.opacity = "1";
        // Report READY only after the first successful optical frame.
        if (!readyReportedRef.current) {
          readyReportedRef.current = true;
          setPhase("ready");
          publishShaderStatus({ phase: "ready", label: "READY" });
        }
      } catch (error) {
        rendererRef.current?.dispose(); rendererRef.current = null;
        canvas.style.opacity = "0";
        const message = error instanceof Error ? error.message : "Shader unavailable";
        setExplanation(message);
        setPhase("fallback");
        publishShaderStatus({ phase: "fallback", label: "CSS MODE" });
      }
    });
  }, []);

  useEffect(() => {
    configRef.current = config;
    draw();
  }, [config, draw]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const width = box.clientWidth, height = box.clientHeight;
      if (width < 5 || height < 5) return;
      const previous = sizeRef.current;
      if (width === previous.width && height === previous.height) return;
      const oldCenter = pointRef.current;
      sizeRef.current = { width, height };
      pointRef.current = previous.width ? {
        x: oldCenter.x / previous.width * width,
        y: oldCenter.y / previous.height * height,
      } : { x: width * .52, y: height * .52 };
      const r = radiusFor(width,height);
      setLens({ ...pointRef.current, diameter: r * 2 });
      sceneRef.current = null;
      draw();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(box);
    measure();
    const canvas = canvasRef.current;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      rendererRef.current = null;
      if (canvas) canvas.style.opacity = "0";
      setPhase("fallback");
      setExplanation("GPU context lost; lightweight preview remains available.");
      publishShaderStatus({ phase: "fallback", label: "CSS MODE" });
    };
    canvas?.addEventListener("webglcontextlost", onContextLost);
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting && !document.hidden;
      if (visibleRef.current) draw();
    }, { threshold: .03 });
    observer.observe(box);
    const onVisibility = () => {
      visibleRef.current = !document.hidden && box.getBoundingClientRect().bottom > 0 && box.getBoundingClientRect().top < window.innerHeight;
      if (visibleRef.current) draw();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      visibleRef.current = false;
      resize.disconnect(); observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas?.removeEventListener("webglcontextlost", onContextLost);
      window.cancelAnimationFrame(pendingRef.current);
      abortRef.current?.abort();
      rendererRef.current?.dispose(); rendererRef.current = null;
    };
  }, [draw]);

  async function enableShader() {
    if (phase === "loading" || phase === "ready") return;
    setPhase("loading"); setExplanation("");
    publishShaderStatus({ phase: "queued", label: "QUEUED" });
    // Only ever import the GLSL shader code after explicit user interaction.
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      // Let the loading UI paint at least once before GPU context creation.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (controller.signal.aborted) return;
      const { GlassRenderer } = await import("@/lib/openglassui/GlassRenderer.js");
      if (controller.signal.aborted || !canvasRef.current) return;
      const renderer = await GlassRenderer.createNonBlocking(canvasRef.current, (milestone) => {
        publishShaderStatus({ phase: milestone, label: milestone.toUpperCase() });
      }, controller.signal);
      if (controller.signal.aborted) { renderer.dispose(); return; }
      rendererRef.current = renderer;
      readyReportedRef.current = false;
      sceneRef.current = null;
      // The READY phase should mean the lens has actually rendered, not
      // merely that GLSL linked successfully.
      draw();
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : "Optical preview unavailable.";
      setExplanation(message);
      setPhase("fallback");
      publishShaderStatus({ phase: "fallback", label: "CSS MODE" });
    }
  }

  function disableShader() {
    abortRef.current?.abort();
    window.cancelAnimationFrame(pendingRef.current);
    pendingRef.current = 0;
    rendererRef.current?.dispose();
    rendererRef.current = null;
    readyReportedRef.current = false;
    sceneRef.current = null;
    if (canvasRef.current) canvasRef.current.style.opacity = "0";
    setPhase("idle");
    publishShaderStatus({ phase: "idle", label: "ON DEMAND" });
  }

  function localPoint(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  const lensStyle = { "--lens-x": `${lens.x}px`, "--lens-y": `${lens.y}px`, "--lens-size": `${lens.diameter}px` } as CSSProperties;
  return (
    <div className={`glass-live-stage performance-glass-stage${phase === "ready" ? " is-webgl" : ""}`} ref={boxRef} style={lensStyle}
      onPointerDown={(event) => {
        if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
        const point = localPoint(event);
        if (Math.hypot(point.x-pointRef.current.x,point.y-pointRef.current.y) > lens.diameter/2 + 13) return;
        dragRef.current = { id: event.pointerId, dx: point.x-pointRef.current.x, dy: point.y-pointRef.current.y };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (dragRef.current?.id !== event.pointerId) return;
        const point = localPoint(event);
        updateLens(point.x-dragRef.current.dx,point.y-dragRef.current.dy);
        draw();
      }}
      onPointerUp={(event) => {
        if (dragRef.current?.id !== event.pointerId) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { dragRef.current = null; }}
    >
      <div className="glass-scene-dom" aria-hidden="true">
        <span className="glass-scene-index mono">01 / OPTICAL TEST</span>
        <span className="glass-scene-orbit" />
        <div className="glass-scene-title">REFRACT</div>
        <div className="glass-scene-caption mono">LIGHT / SPACE / MATERIAL</div>
      </div>
      <canvas className="glass-live-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="glass-lens-emboss" aria-hidden="true" />
      <button type="button" className="glass-lens-keyboard" aria-label="Move preview lens using arrow keys"
        onKeyDown={(event) => {
          const delta: Record<string,[number,number]> = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
          const d = delta[event.key];
          if (!d) return;
          event.preventDefault();
          updateLens(pointRef.current.x+d[0]*(event.shiftKey?24:8),pointRef.current.y+d[1]*(event.shiftKey?24:8));
          draw();
        }}
      >MOVE LENS · ARROW KEYS</button>
      {phase !== "ready" && (
        <button type="button" className="glass-enable-shader" onClick={enableShader} disabled={phase === "loading"}>
          {phase === "loading" ? "Compiling shader…" : phase === "fallback" ? "Retry GPU preview ↗" : "Enable real-time shader ↗"}
        </button>
      )}
      {phase === "ready" && (
        <button type="button" className="glass-disable-shader" onClick={disableShader}>
          ● GPU ACTIVE · PAUSE
        </button>
      )}
      {phase === "fallback" && <span className="glass-shader-explanation" title={explanation}>Lightweight live backdrop mode · GPU shader unavailable</span>}
    </div>
  );
}
