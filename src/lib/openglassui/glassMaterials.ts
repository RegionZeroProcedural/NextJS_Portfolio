/**
 * A shared, opt-in material cache. The demo's existing WebGL program bakes
 * three small optical highlight sheets; the browser composites them over
 * *live* DOM-backdrop displacement. No ambient element owns a GL context.
 */
export type MaterialKind = "panel" | "capsule" | "chip";
export const GLASS_MATERIAL_EVENT = "openglassui:glass-material";

const urls = new Map<MaterialKind, string>();

export function publishGlassMaterial(kind: MaterialKind, url: string) {
  if (typeof document === "undefined") return;
  const prior = urls.get(kind);
  if (prior && prior !== url) URL.revokeObjectURL(prior);
  urls.set(kind, url);
  // Setting a CSS variable is a single style update, not a React rerender
  // of 10 independently animated glass surfaces.
  document.documentElement.style.setProperty(`--openglass-${kind}`, `url("${url}")`);
  window.dispatchEvent(new CustomEvent(GLASS_MATERIAL_EVENT, { detail: { kind } }));
}

export function clearGlassMaterials() {
  if (typeof document === "undefined") return;
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
  for (const kind of ["panel", "capsule", "chip"] as const) {
    document.documentElement.style.removeProperty(`--openglass-${kind}`);
  }
  document.documentElement.classList.remove("openglass-materials-ready");
}
