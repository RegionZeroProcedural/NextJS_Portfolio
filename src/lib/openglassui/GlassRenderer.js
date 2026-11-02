import { vertexShader, fragmentShader } from './shaders.js';
import { DEFAULTS, SHAPES } from './presets.js';

// No Three.js, WebGPU or external rendering runtime: WebGL2 + v11 GLSL.
// All five optional/required textures are caller-managed canvases/images; nothing captures the DOM.
const UNIFORM_NAMES = [
  'uScene', 'uEnvironment', 'uEnvironmentCSS', 'uEnvironmentCenter',
  'uEnvironmentReady', 'uEnvironmentEnabled', 'uEnvironmentRefraction',
  'uEnvironmentDepth', 'uClockOpacity', 'uCompare',
  'uViewportCSS', 'uSceneCSS', 'uRadius', 'uOverhang', 'uPixelRatio',
  'uIOR', 'uRoughness', 'uFrost', 'uTint', 'uDomeHeight',
  'uLipHeight', 'uLipPosition', 'uLipWidth', 'uLipSoftness',
  'uChromaticAberration', 'uImperfectionStrength', 'uMagnification',
  'uRefraction', 'uShading', 'uHighlights', 'uCaustics',
  'uShadows', 'uAntiAlias', 'uDialEnabled',
  'uShape','uShapeAspect','uShapeRotation','uCornerRadius','uSquirclePower','uEdgeSoftness',
  'uHeightMap','uNormalMap','uShapeMask','uHasShapeMask','uHasHeightMap','uHasNormalMap','uHeightStrength','uNormalStrength',
  'uHeightInvert','uNormalFlipY','uMapScale','uMapRotation','uMapRepeat',
  'uLightAngle','uLightElevation','uLightIntensity','uTintStrength','uExposure','uSaturation','uEdgeFade',
  'uGlassOnly','uGlassAlpha',
];

function compile(gl, kind, source) {
  const shader = gl.createShader(kind);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`OpenGlassUI shader failed: ${error}`);
  }
  return shader;
}
function createTexture(gl, unit) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const repeat = (unit === 2 || unit === 3) ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat);
  return texture;
}
function limit(value, min, max, fallback = min) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}
function rgb(hex) {
  if (typeof hex !== 'string' || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) hex = DEFAULTS.tint;
  const v = hex.slice(1);
  const full = v.length === 3 ? [...v].map(c => c + c).join('') : v;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255);
}

/**
 * Standalone WebGL2 optics renderer, independent of React and of clock internals.
 *
 * upload(0, backgroundCanvas) sets the full preview-stage/world texture.
 * upload(1, subjectCanvas) sets the optional foreground (the demo clock).
 * render({ width,height,center,radius,config,pixelRatio }) uses CSS pixel units
 * for viewport and lens geometry. Canvas backing resolution can be larger.
 * This draws the entire background and the lens into a single opaque canvas,
 * so opacity and environmental refraction are composited once, not via CSS.
 *
 * IMPORTANT: textures MUST correspond to the stage and lens in the same
 * coordinate system. Arbitrary HTML elements are not auto-captured.
 */
export class GlassRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    const gl = options.prepared?.gl ?? canvas.getContext('webgl2', {
      alpha: Boolean(options.transparent),
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 unavailable. Use a current browser with hardware acceleration.');
    this.gl = gl;
    let program = options.prepared?.program;
    if (!program) {
      const vs = compile(gl, gl.VERTEX_SHADER, vertexShader);
      const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const message = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`OpenGlassUI program link failed: ${message}`);
      }
    }
    this.program = program;
    this.vao = gl.createVertexArray();
    this.textures = Array.from({ length: 5 }, (_, index) => createTexture(gl, index));
    this.uniforms = Object.fromEntries(UNIFORM_NAMES.map(name => [name, gl.getUniformLocation(program, name)]));
    this.uploaded = [false, false, false, false, false];
    this.textureSizes = [null, null, null, null, null];
    this.disposed = false;
    gl.useProgram(program);
    gl.uniform1i(this.uniforms.uEnvironment, 0);
    gl.uniform1i(this.uniforms.uScene, 1);
    gl.uniform1i(this.uniforms.uHeightMap, 2);
    gl.uniform1i(this.uniforms.uNormalMap, 3);
    gl.uniform1i(this.uniforms.uShapeMask, 4);
    // Initialize fallback texture for every optional slot.
    for (let slot = 0; slot < 5; slot++) {
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[slot]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(slot === 2 ? [128,128,128,255] :
          slot === 3 ? [128,128,255,255] :
          slot === 1 ? [178,217,240,255] : [232,228,219,255]));
    }
  }


  /**
   * Non-blocking, explicitly opted-in shader setup. Uses the WebGL
   * KHR_parallel_shader_compile completion fence rather than calling a
   * synchronous compile-status getter on an unfinished shader. Some mobile
   * browsers omit the extension, so compile shaders one at a time with
   * browser yields as a compatibility path.
   */
  static async createNonBlocking(canvas, onStage = () => {}, signal) {
    const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 32));
    const failIfCanceled = () => {
      if (signal?.aborted) throw new DOMException('Shader load cancelled', 'AbortError');
    };
    failIfCanceled();
    onStage('creating');
    await yieldToBrowser();
    const gl = canvas.getContext('webgl2', {
      alpha: false, antialias: false, premultipliedAlpha: false,
      preserveDrawingBuffer: false, powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is unavailable on this device.');
    const parallel = gl.getExtension('KHR_parallel_shader_compile');
    let vertex = null, fragment = null, program = null;
    try {
      failIfCanceled();
      onStage('compiling');
      await yieldToBrowser();
      vertex = gl.createShader(gl.VERTEX_SHADER);
      fragment = gl.createShader(gl.FRAGMENT_SHADER);
      if (!vertex || !fragment) throw new Error('Unable to allocate shaders.');
      gl.shaderSource(vertex, vertexShader);
      gl.compileShader(vertex);
      await yieldToBrowser();
      failIfCanceled();
      if (!parallel && !gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) {
        throw new Error(`OpenGlassUI vertex shader failed: ${gl.getShaderInfoLog(vertex)}`);
      }
      gl.shaderSource(fragment, fragmentShader);
      gl.compileShader(fragment);
      await yieldToBrowser();
      failIfCanceled();
      if (!parallel && !gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) {
        throw new Error(`OpenGlassUI fragment shader failed: ${gl.getShaderInfoLog(fragment)}`);
      }
      onStage('linking');
      program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate shader program.');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (parallel) {
        const started = performance.now();
        while (!gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) {
          failIfCanceled();
          if (performance.now() - started > 12000) throw new Error('Shader compile timed out. Staying in lightweight mode.');
          await yieldToBrowser();
        }
      } else {
        await yieldToBrowser();
        failIfCanceled();
      }
      failIfCanceled();
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`OpenGlassUI shader link failed: ${gl.getProgramInfoLog(program)}`);
      }
      const instance = new GlassRenderer(canvas, { prepared: { gl, program } });
      program = null; // now owned by the instance
      return instance;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      if (program) gl.deleteProgram(program);
    }
  }

  /** Map uploads accept the same Canvas, HTMLImageElement and ImageBitmap sources. */
  uploadMap(kind, source) {
    const slot = kind === 'height' ? 2 : kind === 'normal' ? 3 : kind === 'mask' ? 4 : null;
    if (slot === null) throw new TypeError("Map type must be 'height', 'normal', or 'mask'");
    this.upload(slot, source);
  }

  clearMap(kind) {
    const slot = kind === 'height' ? 2 : kind === 'normal' ? 3 : kind === 'mask' ? 4 : null;
    if (slot === null) throw new TypeError("Map type must be 'height', 'normal', or 'mask'");
    if (this.disposed) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[slot]);
    const pixel = slot === 2 ? [128,128,128,255] : slot === 3 ? [128,128,255,255] : [0,0,0,255];
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(pixel));
    this.uploaded[slot] = false;
    this.textureSizes[slot] = null;
  }

  /** Upload a Canvas, ImageBitmap or HTMLImageElement to the GPU. */
  upload(slot, source) {
    if (this.disposed) throw new Error('Renderer disposed');
    if (!Number.isInteger(slot) || slot < 0 || slot > 4) throw new RangeError('Texture slot must be 0=world, 1=foreground, 2=height, 3=normal or 4=shape SDF');
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[slot]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    const srcWidth = source.width || source.videoWidth || source.naturalWidth;
    const srcHeight = source.height || source.videoHeight || source.naturalHeight;
    if (!(srcWidth > 0 && srcHeight > 0)) throw new RangeError('Source must have positive pixel dimensions');
    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (srcWidth > maxTexture || srcHeight > maxTexture) {
      throw new RangeError(`Image ${srcWidth}×${srcHeight} exceeds this GPU's ${maxTexture}px texture limit. Resize the source first.`);
    }
    const prior = this.textureSizes[slot];
    if (prior && prior[0] === srcWidth && prior[1] === srcHeight) {
      // Dynamic dial updates don't reallocate GPU texture storage.
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      this.textureSizes[slot] = [srcWidth, srcHeight];
    }
    this.uploaded[slot] = true;
  }

  render({ width, height, center, radius, config = {}, pixelRatio = 1 }) {
    if (this.disposed || !this.uploaded[0]) return;
    const gl = this.gl;
    const o = { ...DEFAULTS, ...config };
    const u = this.uniforms;
    const f = (key, val) => gl.uniform1f(u[key], val);
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
    for (let slot=1; slot<5; slot++) {
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[slot]);
    }
    gl.uniform2f(u.uViewportCSS, w, h);
    gl.uniform2f(u.uEnvironmentCSS, w, h);
    gl.uniform2f(u.uEnvironmentCenter, center.x, h - center.y);
    gl.uniform2f(u.uSceneCSS, radius * 2, radius * 2);
    f('uRadius', radius);
    f('uOverhang', limit(o.overhang, 0, 24, 7));
    f('uPixelRatio', limit(pixelRatio, 0.5, 4, 1));
    f('uEnvironmentReady', 1);
    f('uEnvironmentEnabled', o.environmentEnabled ? 1 : 0);
    f('uEnvironmentRefraction', o.environmentRefraction ? 1 : 0);
    f('uEnvironmentDepth', limit(o.environmentDepth, 0, 3.5, 1.85));
    f('uClockOpacity', limit(o.clockOpacity, 0, 1, 0.75));
    f('uCompare', o.compare ? 1 : 0);
    f('uDialEnabled', o.dialEnabled && this.uploaded[1] ? 1 : 0);
    f('uIOR', limit(o.ior, 1.001, 2.5, 1.517));
    f('uRoughness', limit(o.roughness, 0, 1, 0.17));
    f('uFrost', limit(o.frost, 0, 1, 0.16));
    gl.uniform3fv(u.uTint, rgb(o.tint));
    f('uDomeHeight', limit(o.domeHeight, 0, 0.3, 0.075));
    f('uLipHeight', limit(o.lipHeight, 0, 0.2, 0.065));
    f('uLipPosition', limit(o.lipPosition, 0.75, 1.05, 0.973));
    f('uLipWidth', limit(o.lipWidth, 0.015, 0.25, 0.068));
    f('uLipSoftness', limit(o.lipSoftness, 0, 1, 0.55));
    f('uMagnification', limit(o.magnification, 1, 1.6, 1.34));
    f('uRefraction', limit(o.refraction, 0, 1, 0.88));
    f('uChromaticAberration', limit(o.chromaticAberration, 0, 1, 0.4));
    f('uImperfectionStrength', o.imperfections ? limit(o.imperfectionStrength, 0, 1, 0.35) : 0);
    f('uShading', limit(o.shading, 0, 1, 0.65));
    f('uHighlights', limit(o.highlights, 0, 1, 0.8));
    f('uCaustics', limit(o.caustics, 0, 1, 0.35));
    f('uShadows', limit(o.shadows, 0, 1, 0.85));
    f('uAntiAlias', o.antiAlias ?? 2);
    gl.uniform1i(u.uShape, SHAPES[o.shape] ?? SHAPES.circle);
    f('uShapeAspect',limit(o.shapeAspect,0.55,30,1));
    f('uShapeRotation',limit(o.shapeRotation,-180,180,0)*Math.PI/180);
    f('uCornerRadius',limit(o.cornerRadius,0.005,1,0.28));
    f('uSquirclePower',limit(o.squirclePower,2,12,4));
    f('uEdgeSoftness',limit(o.edgeSoftness,0.65,5,1.3));
    f('uHasHeightMap',this.uploaded[2] ? 1:0);
    f('uHasNormalMap',this.uploaded[3] ? 1:0);
    f('uHasShapeMask',this.uploaded[4] ? 1:0);
    f('uHeightStrength',limit(o.heightStrength,0,0.2,0.006));
    f('uNormalStrength',limit(o.normalStrength,0,1,0.035));
    f('uHeightInvert',o.heightInvert?1:0);
    f('uNormalFlipY',o.normalFlipY?1:0);
    f('uMapScale',limit(o.mapScale,0.25,4,1));
    f('uMapRotation',limit(o.mapRotation,-180,180,0)*Math.PI/180);
    f('uMapRepeat',o.mapRepeat?1:0);
    f('uLightAngle',limit(o.lightAngle,-180,180,2.15*180/Math.PI)*Math.PI/180);
    f('uLightElevation',limit(o.lightElevation,0,90,0.8*180/Math.PI)*Math.PI/180);
    f('uLightIntensity',limit(o.lightIntensity,0,3,1));
    f('uTintStrength',limit(o.tintStrength,0,3,1));
    f('uExposure',limit(o.exposure,-2,2,0));
    f('uSaturation',limit(o.saturation,0,2,1));
    f('uEdgeFade',limit(o.edgeFade,0,1,0));
    f('uGlassOnly', o.glassOnly ? 1 : 0);
    f('uGlassAlpha', limit(o.glassAlpha, 0, 1, 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    if (!gl.isContextLost()) {
      this.textures.forEach(texture => gl.deleteTexture(texture));
      gl.deleteVertexArray(this.vao);
      gl.deleteProgram(this.program);
    }
  }
}
