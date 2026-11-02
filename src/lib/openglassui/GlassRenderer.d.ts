export interface GlassRenderConfig {
  ior?: number;
  roughness?: number;
  frost?: number;
  tint?: string;
  domeHeight?: number;
  lipHeight?: number;
  lipWidth?: number;
  lipPosition?: number;
  lipSoftness?: number;
  overhang?: number;
  magnification?: number;
  refraction?: number;
  chromaticAberration?: number;
  imperfections?: boolean;
  imperfectionStrength?: number;
  shading?: number;
  highlights?: number;
  caustics?: number;
  shadows?: number;
  environmentEnabled?: boolean;
  environmentRefraction?: boolean;
  environmentDepth?: number;
  clockOpacity?: number;
  compare?: boolean;
  dialEnabled?: boolean;
  antiAlias?: number;
  shape?: string;
  shapeAspect?: number;
  shapeRotation?: number;
  cornerRadius?: number;
  squirclePower?: number;
  edgeSoftness?: number;
  lightAngle?: number;
  lightElevation?: number;
  lightIntensity?: number;
  tintStrength?: number;
  exposure?: number;
  saturation?: number;
  edgeFade?: number;
  /** Draw only the glass silhouette; leave pixels outside it transparent. */
  glassOnly?: boolean;
  glassAlpha?: number;
}
export interface GlassRenderInput {
  width: number;
  height: number;
  center: { x: number; y: number };
  radius: number;
  pixelRatio?: number;
  config?: GlassRenderConfig;
}
export class GlassRenderer {
  constructor(canvas: HTMLCanvasElement, options?: { transparent?: boolean });
  static createNonBlocking(canvas: HTMLCanvasElement, onStage?: (stage: "creating" | "compiling" | "linking") => void, signal?: AbortSignal): Promise<GlassRenderer>;
  upload(slot: number, source: HTMLCanvasElement | HTMLImageElement | ImageBitmap): void;
  render(input: GlassRenderInput): void;
  dispose(): void;
}
