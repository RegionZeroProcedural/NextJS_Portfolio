/** v11 public defaults retain the v10 circle and optical model.
 * Surface geometry is normalized to lens radius; angles are degrees in JS.
 */
export const DEFAULTS = Object.freeze({
  ior: 1.517,
  roughness: 0.17,
  frost: 0.16,
  tint: '#8bc8ed',
  domeHeight: 0.075,
  lipHeight: 0.065,
  lipWidth: 0.068,
  lipPosition: 0.973,
  lipSoftness: 0.55,
  overhang: 7,
  magnification: 1.34,
  refraction: 0.88,
  chromaticAberration: 0.4,
  imperfections: false,
  imperfectionStrength: 0.35,
  shading: 0.65,
  highlights: 0.8,
  caustics: 0.35,
  shadows: 0.85,
  environmentEnabled: true,
  environmentRefraction: true,
  environmentDepth: 1.85,
  clockOpacity: 0.75,
  compare: false,
  dialEnabled: true,
  gridEnabled: true,
  animate: true,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  quality: 'balanced',
  shape: 'circle',
  shapeAspect: 1,
  shapeRotation: 0,
  cornerRadius: 0.28,
  squirclePower: 4,
  edgeSoftness: 1.3,
  heightStrength: 0.006,
  normalStrength: 0.035,
  heightInvert: false,
  normalFlipY: false,
  mapScale: 1,
  mapRotation: 0,
  mapRepeat: false,
  lightAngle: 123,
  lightElevation: 46,
  lightIntensity: 1,
  tintStrength: 1,
  exposure: 0,
  saturation: 1,
  edgeFade: 0,
});

export const QUALITY = Object.freeze({
  battery: Object.freeze({ scale: 1, antiAlias: 1, fps: 30 }),
  balanced: Object.freeze({ scale: 1.15, antiAlias: 2, fps: 45 }),
  detail: Object.freeze({ scale: 1.5, antiAlias: 2, fps: 60 }),
});

export const PRESETS = Object.freeze({
  Optical: { ...DEFAULTS },
  Crystal: { ...DEFAULTS, roughness: 0.07, frost: 0.04, chromaticAberration: 0.26, highlights: 0.96, lipHeight: 0.075, environmentDepth: 2.1 },
  Frosted: { ...DEFAULTS, roughness: 0.42, frost: 0.46, lipSoftness: 0.8, refraction: 0.55, chromaticAberration: 0.2, imperfections: true },
  Macro: { ...DEFAULTS, magnification: 1.57, refraction: 0.98, environmentDepth: 2.7, lipHeight: 0.085, chromaticAberration: 0.68 },
  Capsule: { ...DEFAULTS, shape: 'capsule', shapeAspect: 1.42, lipHeight: .053, magnification: 1.18, clockOpacity: 0.0 },
  SoftCard: { ...DEFAULTS, shape: 'roundedRect', shapeAspect: 1.28, cornerRadius: .22, lipHeight: .047, lipPosition: .95, clockOpacity: 0.0, frost: .16 },
  Prism: { ...DEFAULTS, shape: 'hexagon', refraction: .95, chromaticAberration: .72, magnification: 1.18, clockOpacity: 0.0 },
});

export function normalizeGlassSettings(settings = {}) {
  return { ...DEFAULTS, ...settings };
}

export const SHAPES = Object.freeze({
  circle: 0, ellipse: 1, roundedRect: 2, rectangle: 3,
  capsule: 4, squircle: 5, hexagon: 6, mask: 7,
});
