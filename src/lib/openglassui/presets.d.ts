import type { GlassRenderConfig } from './GlassRenderer.js';
export const DEFAULTS: Readonly<GlassRenderConfig>;
export const PRESETS: Readonly<Record<string, GlassRenderConfig>>;
export const QUALITY: Readonly<Record<string, { scale: number; antiAlias: number; fps: number }>>;
export function normalizeGlassSettings(settings?: GlassRenderConfig): GlassRenderConfig;
export const SHAPES: Readonly<Record<string, number>>;
