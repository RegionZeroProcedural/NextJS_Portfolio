"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Project } from "@/data/portfolio";
import { GlassStage } from "@/components/GlassStage";
import { DEFAULTS, PRESETS } from "@/lib/openglassui/presets.js";
import type { GlassRenderConfig } from "@/lib/openglassui/GlassRenderer.js";

type NumericSetting = {
  key: keyof GlassRenderConfig;
  name: string;
  min: number;
  max: number;
  step: number;
  precision?: number;
};

const primary: NumericSetting[] = [
  { key: "ior", name: "Index / IOR", min: 1.001, max: 2.5, step: 0.001, precision: 3 },
  { key: "refraction", name: "Refraction", min: 0, max: 1, step: 0.01 },
  { key: "magnification", name: "Magnify", min: 1, max: 1.6, step: 0.01, precision: 2 },
  { key: "roughness", name: "Roughness", min: 0, max: 1, step: 0.01 },
  { key: "frost", name: "Frost", min: 0, max: 1, step: 0.01 },
  { key: "domeHeight", name: "Dome", min: 0, max: 0.3, step: 0.005, precision: 3 },
  { key: "lipHeight", name: "Lip height", min: 0, max: 0.2, step: 0.005, precision: 3 },
  { key: "chromaticAberration", name: "Chromatic", min: 0, max: 1, step: 0.01 },
];
const advanced: NumericSetting[] = [
  { key: "lipWidth", name: "Lip width", min: 0.015, max: 0.25, step: 0.001, precision: 3 },
  { key: "lipSoftness", name: "Lip softness", min: 0, max: 1, step: 0.01 },
  { key: "highlights", name: "Highlights", min: 0, max: 1, step: 0.01 },
  { key: "shading", name: "Shading", min: 0, max: 1, step: 0.01 },
  { key: "caustics", name: "Caustics", min: 0, max: 1, step: 0.01 },
  { key: "shadows", name: "Shadows", min: 0, max: 1, step: 0.01 },
  { key: "environmentDepth", name: "Env. depth", min: 0, max: 3.5, step: 0.05 },
  { key: "lightIntensity", name: "Light", min: 0, max: 3, step: 0.05 },
  { key: "imperfectionStrength", name: "Texture", min: 0, max: 1, step: 0.01 },
  { key: "tintStrength", name: "Tint", min: 0, max: 3, step: 0.05 },
  { key: "exposure", name: "Exposure", min: -2, max: 2, step: 0.05 },
  { key: "saturation", name: "Saturation", min: 0, max: 2, step: 0.05 },
];

// A deliberately clearer starting material for a portfolio visitor. The
// underlying renderer, shader and individual optical controls remain original.
const STUDIO_PRESET: GlassRenderConfig = {
  ...DEFAULTS,
  domeHeight: 0.14,
  lipHeight: 0.085,
  lipWidth: 0.078,
  lipPosition: 0.952,
  refraction: 0.85,
  environmentDepth: 2.45,
  chromaticAberration: 0.32,
  roughness: 0.085,
  frost: 0.065,
  tintStrength: 0.85,
  imperfections: true,
  imperfectionStrength: 0.28,
  clockOpacity: 0,
  dialEnabled: false,
};

function formatValue(value: number, control: NumericSetting) {
  return value.toFixed(control.precision ?? 2);
}

export function GlassProjectCard({ project, index }: { project: Project; index: number }) {
  const [config, setConfig] = useState<GlassRenderConfig>(() => ({ ...STUDIO_PRESET }));
  const [expanded, setExpanded] = useState(false);
  const [preset, setPreset] = useState("Studio");

  const updateNumber = (key: NumericSetting["key"], value: number) => {
    setConfig((current) => ({ ...current, [key]: value }));
    setPreset("Custom");
  };
  const selectPreset = (name: string) => {
    if (name === "Studio") {
      setConfig({ ...STUDIO_PRESET });
      setPreset(name);
      return;
    }
    if (!PRESETS[name]) return;
    setPreset(name);
    setConfig({ ...PRESETS[name], dialEnabled: false, clockOpacity: 0 });
  };

  function controlGrid(items: NumericSetting[]) {
    return items.map((setting) => {
      const value = typeof config[setting.key] === "number" ? config[setting.key] as number : 0;
      return (
        <label className="glass-control" key={setting.key}>
          <span className="glass-control-header"><span>{setting.name}</span><output>{formatValue(value, setting)}</output></span>
          <input
            type="range"
            min={setting.min}
            max={setting.max}
            step={setting.step}
            value={value}
            aria-label={`OpenGlassUI ${setting.name}`}
            onChange={(event) => updateNumber(setting.key, Number(event.target.value))}
            style={{ "--range-fill": `${(value - setting.min) / (setting.max - setting.min) * 100}%` } as CSSProperties}
          />
        </label>
      );
    });
  }

  return (
    <article className="project-card glass-panel project-glass glass-interactive-card">
      <div className="project-preview glass-interactive-preview">
        <span className="preview-index mono">PROJECT / 0{index + 1}</span>
        <GlassStage config={config} />
      </div>
      <div className="project-content glass-project-content">
        <div className="glass-project-copy">
          <p className="project-category mono">{project.category}</p>
          <h3>{project.name}</h3>
          <p className="project-description">{project.description}</p>
          <ul className="tag-list" aria-label={`${project.name} technologies`}>
            {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
          <details className="project-details">
            <summary><span>Engineering notes</span><span aria-hidden="true">＋</span></summary>
            <div className="project-detail-copy">
              <p><strong>Problem space</strong>{project.challenge}</p>
              <p><strong>Implementation</strong>{project.approach}</p>
            </div>
          </details>
          {project.links && <div className="project-links">{project.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>}
        </div>
        <div className="glass-controls-panel" aria-label="OpenGlassUI live rendering controls">
          <div className="glass-controls-heading">
            <span className="mono">LIVE OPTICS <span className="glass-controls-live">●</span></span>
            <div className="glass-control-actions">
              <button className="glass-reset" type="button" onClick={() => selectPreset("Studio")}>Reset</button>
              <button
                className="glass-expand"
                type="button"
                aria-expanded={expanded}
                aria-controls="glass-advanced-controls"
                onClick={() => setExpanded((wasExpanded) => !wasExpanded)}
              >{expanded ? "Less" : "More"} <span aria-hidden="true">{expanded ? "−" : "+"}</span></button>
            </div>
          </div>
          <div className="glass-controls-grid">{controlGrid(primary)}</div>
          {expanded && <div id="glass-advanced-controls" className="glass-expanded-controls">
            <div className="glass-controls-grid">{controlGrid(advanced)}</div>
            <div className="glass-controls-extras">
              <label>Preset
                <select value={preset} onChange={(event) => selectPreset(event.target.value)}>
                  {preset === "Custom" && <option value="Custom">Custom</option>}
                  <option value="Studio">Studio</option>
                  {Object.keys(PRESETS).map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label>Shape
                <select value={config.shape ?? "circle"} onChange={(event) => {setConfig((current) => ({ ...current, shape: event.target.value })); setPreset("Custom");}}>
                  {["circle", "ellipse", "squircle", "roundedRect", "capsule", "hexagon"].map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label className="glass-toggle">
                <input type="checkbox" checked={config.imperfections ?? false} onChange={(event) => {setConfig((current) => ({ ...current, imperfections: event.target.checked })); setPreset("Custom");}} />
                Micro imperfections
              </label>
            </div>
          </div>}
          <p className="glass-controls-hint">Change the lens parameters above · drag the lens to move it</p>
        </div>
      </div>
    </article>
  );
}
