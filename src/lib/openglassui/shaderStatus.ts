/** Phase markers are real milestones, not a fabricated compilation percentage. */
export type ShaderPhase = "idle" | "queued" | "creating" | "compiling" | "linking" | "ready" | "fallback";
export type ShaderStatus = { phase: ShaderPhase; label: string };
export const SHADER_STATUS_EVENT = "openglassui:shader-status";

export function publishShaderStatus(status: ShaderStatus) {
  if (typeof window !== "undefined") {
    // One authoritative opt-in switch for the preview and decorative DOM optics.
    // Only the first successful WebGL frame enables the other glass surfaces.
    // No second WebGL context, texture readback or shader compilation is needed.
    document.documentElement.classList.toggle("glass-optics-live", status.phase === "ready");
    window.dispatchEvent(new CustomEvent<ShaderStatus>(SHADER_STATUS_EVENT, { detail: status }));
  }
}
