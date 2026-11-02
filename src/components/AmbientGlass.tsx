"use client";

import { useEffect, useRef } from "react";
import { RefractiveSurface } from "@/components/RefractiveSurface";
import { SHADER_STATUS_EVENT, type ShaderStatus } from "@/lib/openglassui/shaderStatus";

/**
 * A document-height field of miniaturized glass interface fragments. The
 * pieces become smaller as the visitor explores the page. They float via
 * persistent compositor-only CSS transforms; none creates WebGL contexts.
 * Refraction is enabled only after the live shader's first successful frame.
 * The observer limits live DOM-backdrop displacement to visible pieces.
 * It never gates animation: all ten elements float continuously.
 */
export function AmbientGlass() {
  const fieldRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = fieldRef.current;
    if (!root) return;
    const pieces = Array.from(root.querySelectorAll<HTMLElement>(".ambient-glass-object"));
    const intersecting = new Set<HTMLElement>();
    let opticsReady = document.documentElement.classList.contains("glass-optics-live");

    // Each active moving backdrop filter has a compositing cost. Upgrade the
    // visible pieces progressively, with a hard cap of three (one on touch).
    // Every piece receives the same treatment when it scrolls into view.
    const refreshOptics = () => {
      const limit = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches ? 1 : 3;
      let assigned = 0;
      for (const piece of pieces) {
        const active = opticsReady && intersecting.has(piece) && assigned < limit;
        piece.classList.toggle("optical-active", active);
        if (active) assigned += 1;
      }
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const piece = entry.target as HTMLElement;
        if (entry.isIntersecting) intersecting.add(piece);
        else intersecting.delete(piece);
        piece.classList.toggle("is-visible", entry.isIntersecting);
      }
      refreshOptics();
    }, { rootMargin: "75px 0px", threshold: 0.01 });
    pieces.forEach((piece) => observer.observe(piece));
    const onShaderStatus = (event: Event) => {
      opticsReady = (event as CustomEvent<ShaderStatus>).detail.phase === "ready";
      refreshOptics();
    };
    const onViewportChanged = () => refreshOptics();
    window.addEventListener(SHADER_STATUS_EVENT, onShaderStatus);
    window.addEventListener("resize", onViewportChanged, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener(SHADER_STATUS_EVENT, onShaderStatus);
      window.removeEventListener("resize", onViewportChanged);
      pieces.forEach((piece) => piece.classList.remove("optical-active"));
    };
  }, []);
  return (
    <div className="ambient-glass-field" ref={fieldRef} aria-hidden="true">
      <div className="ambient-glass-object ambient-object-metrics">
        <RefractiveSurface variant="metrics">
          <div className="ambient-ui-heading"><span><i className="ambient-ui-dot" />LIVE TELEMETRY</span><span>↗</span></div>
          <div className="ambient-ui-value">60.0 <small>FPS</small></div>
          <div className="ambient-ui-track"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
          <span className="ambient-ui-footer">GPU ACTIVE <b>●</b> 12.4 MS</span>
        </RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-inspector">
        <RefractiveSurface variant="inspector">
          <div className="ambient-ui-heading"><span>◈ &nbsp; NODE INSPECTOR</span><span>···</span></div>
          <div className="ambient-node"><span>01</span><b>INPUT</b><em>●</em></div>
          <div className="ambient-node"><span>02</span><b>TRANSFORM</b><em>◉</em></div>
          <div className="ambient-node"><span>03</span><b>OUTPUT</b><em>●</em></div>
          <span className="ambient-ui-footer">EXECUTION GRAPH / 03</span>
        </RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-toolbar">
        <RefractiveSurface variant="toolbar">
          <div className="ambient-toolrow"><span>⌘</span><span>◫</span><span>⌘</span><span>◎</span><b>GLASS / 01</b></div>
        </RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-activity">
        <RefractiveSurface variant="metrics">
          <div className="ambient-ui-heading"><span>◈ SIGNAL / 04</span><span>↗</span></div>
          <div className="ambient-mini-bars"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <span className="ambient-ui-footer">EXECUTION STATE</span>
        </RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-flow">
        <RefractiveSurface variant="toolbar">
          <div className="ambient-toolrow ambient-tight-row"><span>◇</span><span>→</span><span>◉</span><b>FLOW</b></div>
        </RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-compile">
        <RefractiveSurface variant="inspector">
          <div className="ambient-ui-heading"><span>BUILD / OK</span><span>✓</span></div>
          <div className="ambient-micro-code"><span>const</span> tool = <b>craft</b>();</div>
          <span className="ambient-ui-footer">0 ERRORS</span>
        </RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-stack">
        <RefractiveSurface variant="metrics">
          <div className="ambient-ui-heading"><span>RENDER</span><span>◉</span></div>
          <div className="ambient-small-value">16.7 <small>ms</small></div>
          <span className="ambient-ui-footer">FRAME / 01</span>
        </RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-packet">
        <RefractiveSurface variant="chip"><div className="ambient-chip-content"><span>◇</span><b>TCP / OK</b></div></RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-token">
        <RefractiveSurface variant="chip"><div className="ambient-chip-content"><span>⌁</span><b>0x42E</b></div></RefractiveSurface>
      </div>
      <div className="ambient-glass-object ambient-object-dot">
        <RefractiveSurface variant="chip"><div className="ambient-chip-content"><span>◈</span><b>SYNC</b></div></RefractiveSurface>
      </div>
    </div>
  );
}
