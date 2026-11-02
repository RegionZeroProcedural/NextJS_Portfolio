// OpenGlassUI v11: customizable v10 physics surface plus shape and texture-map extensions.
// Stage-local WebGL2 compositing replaces the original clock-only canvas.
export const vertexShader = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  // The oversized full-screen triangle uses p in [0, 2]. On the visible
  // viewport p already spans [0, 1]. Halving p sampled only one quadrant.
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const fragmentShader = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uScene;
// A second, independent texture contains the exact scene behind the dial.
uniform sampler2D uEnvironment;
uniform vec2 uEnvironmentCSS;
uniform vec2 uEnvironmentCenter;
uniform float uEnvironmentReady;
uniform float uEnvironmentEnabled;
uniform float uEnvironmentRefraction;
uniform float uEnvironmentDepth;
uniform float uClockOpacity;
uniform float uCompare;
uniform vec2 uViewportCSS;
uniform vec2 uSceneCSS;
uniform float uRadius;
uniform float uOverhang;
uniform float uPixelRatio;
uniform float uIOR;
uniform float uRoughness;
uniform float uFrost;
uniform vec3 uTint;
uniform float uDomeHeight;
uniform float uLipHeight;
uniform float uLipPosition;
uniform float uLipWidth;
uniform float uLipSoftness;
uniform float uChromaticAberration;
uniform float uImperfectionStrength;
uniform float uMagnification;
uniform float uRefraction;
uniform float uShading;
uniform float uHighlights;
uniform float uCaustics;
uniform float uShadows;
uniform float uAntiAlias;
uniform float uDialEnabled;
// Geometry: circle, ellipse, rounded rectangle, rectangle, capsule, squircle, hexagon.
uniform int uShape;
uniform float uShapeAspect;
uniform float uShapeRotation;
uniform float uCornerRadius;
uniform float uSquirclePower;
uniform float uEdgeSoftness;
// User-supplied grayscale height/standard tangent-space normal maps.
uniform sampler2D uHeightMap;
uniform sampler2D uNormalMap;
uniform sampler2D uShapeMask;
uniform float uHasShapeMask;
uniform float uHasHeightMap;
uniform float uHasNormalMap;
uniform float uHeightStrength;
uniform float uNormalStrength;
uniform float uHeightInvert;
uniform float uNormalFlipY;
uniform float uMapScale;
uniform float uMapRotation;
uniform float uMapRepeat;
// Additional appearance / directional artistic control.
uniform float uLightAngle;
uniform float uLightElevation;
uniform float uLightIntensity;
uniform float uTintStrength;
uniform float uExposure;
uniform float uSaturation;
uniform float uEdgeFade;
// Opt-in transparent output makes the same optical engine usable as a DOM overlay.
uniform float uGlassOnly;
uniform float uGlassAlpha;

float sat(float x) { return clamp(x, 0.0, 1.0); }
// Rotate local lens pixels. Positive input is counter-clockwise in GLSL (Y-up).
vec2 spin(vec2 p, float a) {
  float sn = sin(a), cs = cos(a);
  return vec2(cs*p.x-sn*p.y, sn*p.x+cs*p.y);
}
// The classic box signed-distance formula contains an internal medial-axis
// ridge (max(k.x,k.y)). When the distance is differentiated to form the lens
// normal, that ridge creates visible diagonal refraction seams. Smooth the
// *interior* maximum while keeping the true rounded-box outside distance.
float smoothInteriorMax(float a, float b, float softness) {
  float d = abs(a-b);
  float h = max(softness-d,0.0) / softness;
  return max(a,b) + (softness * 0.25) * h*h;
}
float roundBoxMetric(vec2 q, float corner) {
  float c = max(0.002,corner);
  vec2 b = vec2(1.0-c);
  // Differentiable abs also prevents a micro crease along the center axes.
  vec2 k = sqrt(q*q + vec2(0.000004)) - b;
  vec2 outside = max(k,vec2(0.0));
  float exterior = length(outside);
  float interior = smoothInteriorMax(k.x,k.y,0.48);
  // Blend through the join: both fields are continuous at the transition.
  float blend = smoothstep(-0.035,0.065,max(k.x,k.y));
  return 1.0 + mix(interior,exterior,blend) - c;
}
// A dimensionless distance-to-silhouette metric: r=1 at the boundary.
// Geometry, refraction, reflections and clipping all use THIS same metric.
float shapeMetric(vec2 pixel) {
  vec2 q = spin(pixel / uRadius, -uShapeRotation);
  float aspect = max(0.45, uShapeAspect);
  if (uShape == 7 && uHasShapeMask > 0.5) {
    vec2 uv = clamp(vec2(.5)+q/vec2(aspect,1.0)*.5,vec2(.001),vec2(.999));
    return max(0.0,2.0-2.0*texture(uShapeMask,uv).r);
  }
  if (uShape == 1) return length(q/vec2(aspect,1.0)); // ellipse
  if (uShape == 2) return roundBoxMetric(q/vec2(aspect,1.0),uCornerRadius);
  if (uShape == 3) return roundBoxMetric(q/vec2(aspect,1.0),0.002);
  if (uShape == 4) { // true horizontal/vertical capsule in local coordinates
    vec2 halfExtents = vec2(aspect,1.0);
    float cap = min(halfExtents.x,halfExtents.y);
    vec2 k = abs(q) - (halfExtents - vec2(cap));
    return 1.0 + (length(max(k,vec2(0.0))) + min(max(k.x,k.y),0.0) - cap) / cap;
  }
  if (uShape == 5) { // independent roundness exponent (2=ellipse, >2=squarer)
    vec2 t = abs(q / vec2(aspect,1.0));
    float e = max(2.0,uSquirclePower);
    return pow(pow(t.x,e)+pow(t.y,e),1.0/e);
  }
  if (uShape == 6) { // exact regular six-sided contour, flat top and bottom
    vec2 t = q/vec2(aspect,1.0);
    float d = -100.0;
    for (int j=0; j<6; j++) {
      float a = 6.28318530718 * float(j) / 6.0 + 1.57079632679;
      d = max(d, dot(t, vec2(cos(a),sin(a))) / 0.86602540378);
    }
    return d;
  }
  return length(q); // original circular lens
}
// Gradients are derivatives of the *shape metric* in radius-normalized
// coordinates. This also works for flat-sided lenses and rotated shapes.
vec2 metricGradient(vec2 pixel) {
  // SDF images are 8-bit; broaden normal differences to suppress texel noise.
  float e = (uShape == 7 ? 0.010 : 0.0025) * uRadius;
  float sx = shapeMetric(pixel+vec2(e,0.0))-shapeMetric(pixel-vec2(e,0.0));
  float sy = shapeMetric(pixel+vec2(0.0,e))-shapeMetric(pixel-vec2(0.0,e));
  return vec2(sx,sy) * (uRadius / (2.0*e));
}
vec2 lensMapUV(vec2 pixel) {
  vec2 q = spin(pixel/uRadius, -uShapeRotation-uMapRotation);
  q.x /= max(0.45,uShapeAspect);
  vec2 uv = vec2(0.5)+q * (0.5*uMapScale);
  // GL_REPEAT avoids visible seams when the developer tiles a surface map.
  return uMapRepeat > 0.5 ? uv : clamp(uv,vec2(0.001),vec2(0.999));
}
float heightTexel(vec2 pixel) {
  float value = texture(uHeightMap, lensMapUV(pixel)).r;
  return mix(value,1.0-value,uHeightInvert);
}
vec2 mapGradient(vec2 pixel) {
  if (uHasHeightMap < 0.5 || uHeightStrength < 0.00001) return vec2(0.0);
  float e = 0.003 * uRadius;
  vec2 derivative = vec2(
    heightTexel(pixel+vec2(e,0.0))-heightTexel(pixel-vec2(e,0.0)),
    heightTexel(pixel+vec2(0.0,e))-heightTexel(pixel-vec2(0.0,e))
  ) / 0.006;
  return derivative * uHeightStrength;
}
vec2 normalMapGradient(vec2 pixel) {
  if (uHasNormalMap < 0.5 || uNormalStrength < 0.00001) return vec2(0.0);
  vec3 n = texture(uNormalMap,lensMapUV(pixel)).rgb*2.0-1.0;
  n.y = mix(n.y,-n.y,uNormalFlipY);
  n = normalize(n + vec3(0.0,0.0,0.0001));
  // Tangent normals encode the perturbation of the same height surface.
  vec2 gradient = -n.xy / max(0.2,n.z);
  return spin(gradient,uShapeRotation+uMapRotation)*uNormalStrength;
}
// One continuous radial height field lifted over arbitrary shape-distance geometry.
vec3 surface(float r) {
  float base = max(0.0, 1.0 - r*r);
  float dome = uDomeHeight * base*base;
  float domeSlope = r < 1.0 ? -4.0*uDomeHeight*r*base : 0.0;
  float w = max(uLipWidth, 0.005);
  float t = (r-uLipPosition)/w;
  // A Gaussian has a narrow inner shoulder. Blend toward a Lorentzian
  // profile for a broader, softer caulk-like transition into the dome.
  // Both profiles and their analytical derivatives are smooth and share
  // the same peak height; the normals and refraction use this exact curve.
  float gauss = exp(-t*t);
  float lorentz = 1.0 / (1.0 + t*t);
  float shoulder = 0.65 * sat(uLipSoftness);
  float lip = uLipHeight * mix(gauss, lorentz, shoulder);
  float lipSlope = -2.0*t*uLipHeight/w * mix(gauss, lorentz*lorentz, shoulder);
  return vec3(dome+lip, domeSlope+lipSlope, mix(gauss,lorentz,shoulder));
}

// Stable, deterministic polishing variation. No time-dependent noise:
// the tiny undulations remain fixed to the glass while the hands move.
// These are derivatives of a smooth, low-amplitude height perturbation
// over *normalized* lens space, so resizing preserves their proportions.
vec2 polishGradient(vec2 pos) {
  if (uImperfectionStrength <= 0.0) return vec2(0.0);
  vec2 q = pos / uRadius;
  float r = shapeMetric(pos);
  // Fade the effect at the very center and at the seating edge; the
  // primary dome/lip geometry is unaffected and remains circular.
  float envelope = smoothstep(0.05, 0.22, r) *
                   (1.0 - smoothstep(0.86, 1.0, r));
  float a = dot(q, vec2(15.0, 10.0)) + 0.8;
  float b = dot(q, vec2(-11.0, 19.0)) - 0.45;
  float c = dot(q, vec2(29.0, -24.0)) + 1.6;
  vec2 gradient =
      0.0050 * vec2(0.83205, 0.55470) * cos(a) +
      0.0036 * vec2(-0.50104, 0.86543) * cos(b) +
      0.0014 * vec2(0.77096, -0.63689) * cos(c);
  return gradient * envelope * uImperfectionStrength;
}

vec3 normalAt(vec2 pos, float r) {
  vec3 shape = surface(r);
  vec2 gradient = shape.y * metricGradient(pos) + polishGradient(pos)
                + mapGradient(pos) + normalMapGradient(pos);
  return normalize(vec3(-gradient, 1.0));
}

// Orthographic two-interface Snell approximation: curved front surface,
// approximately planar rear surface, then a virtual gap to the dial.
// The final fade through the seating lip prevents folded/overlapping grid
// lines where very high edge curvature would produce a caustic singularity.
// No separately invented radial zoom field is applied.
vec2 sourcePosition(vec2 pixel, float ior) {
  float r = shapeMetric(pixel);
  if (r >= 1.0) return pixel;
  vec3 h = surface(r);
  vec3 n = normalAt(pixel, r);
  vec3 insideRay = refract(vec3(0.0, 0.0, -1.0), n, 1.0 / ior);
  vec3 exitRay = refract(insideRay, vec3(0.0, 0.0, 1.0), ior);
  float slopeThickness = 0.09 + h.x;
  float virtualGap = 0.20 + max(0.0, uMagnification - 1.0) * 4.0;
  // Refraction distance is proportional to geometry/optical-depth settings.
  vec2 travel =
    insideRay.xy / max(0.1, -insideRay.z) * slopeThickness +
    exitRay.xy / max(0.1, -exitRay.z) * virtualGap;
  float aperture = 1.0 - smoothstep(0.65, 0.91, r);
  // The lip remains fully shaded; transmission smoothly seats onto the dial.
  return pixel + uRadius * uRefraction * aperture * travel;
}

vec2 sceneUV(vec2 pixel, float ior) {
  vec2 uv = sourcePosition(pixel, ior) / uSceneCSS + 0.5;
  // The dial texture is square and centered in the lens' pixel coordinates.
  return clamp(uv, vec2(0.002), vec2(0.998));
}

vec4 sceneSample(vec2 pixel) {
  return texture(uScene, sceneUV(pixel, uIOR));
}

// The backdrop has a separate, STAGE-LOCAL UV map. uEnvironmentCenter is
// the lens center in the environment texture's CSS coordinates, with Y up.
// Moving the clock updates this uniform; no background rerasterization needed.
vec2 environmentUV(vec2 pixel, float ior, float refractAmount) {
  vec2 samplePosition = pixel;
  if (refractAmount > 0.0001) {
    samplePosition += (sourcePosition(pixel, ior) - pixel) *
                      uEnvironmentDepth * refractAmount;
    // Raised seating lip has a real optical silhouette outside the dial.
    // A small, bounded normal-based deflection extends refraction through
    // the rim without introducing the fold-overs seen in early SVG builds.
    float r = shapeMetric(pixel);
    float shoulder = smoothstep(0.79, 0.87, r) *
                     (1.0 - smoothstep(1.025, 1.065, r));
    vec3 normal = normalAt(pixel,r);
    float strength = min(6.5, 3.5*uEnvironmentDepth*uRefraction) *
                     (ior/1.517) * shoulder * refractAmount;
    samplePosition += normal.xy * strength;
  }
  vec2 uv = (uEnvironmentCenter + samplePosition) / uEnvironmentCSS;
  return clamp(uv, vec2(0.001), vec2(0.999));
}

// A/B comparison changes ONLY the backdrop distortion: the dial is still
// refracted in both halves, so the difference is easy to isolate.
float environmentRefractAmount(vec2 pixel) {
  float strength = uEnvironmentRefraction * uEnvironmentEnabled;
  if (uCompare > 0.5 && pixel.x >= 0.0) strength = 0.0;
  return strength;
}

vec3 sampleEnvironment(vec2 pixel) {
  float amount = environmentRefractAmount(pixel);
  vec3 base = texture(uEnvironment, environmentUV(pixel, uIOR, amount)).rgb;
  if (amount < 0.001 || uChromaticAberration < 0.001 || uRefraction < 0.001) return base;
  float r = shapeMetric(pixel);
  float onset = smoothstep(0.14, 0.72, r);
  float seat = 1.0-smoothstep(0.88, 0.995, r);
  float strength = uChromaticAberration * amount * onset * seat;
  if (strength < 0.00001) return base;
  float deltaIOR = 0.024 * uChromaticAberration;
  vec3 n = normalAt(pixel,r);
  float slope = length(n.xy);
  vec2 edge = slope > 0.00001 ? n.xy / slope : vec2(0.0);
  vec2 boost = edge * (1.8 * strength * smoothstep(.025,.17,slope) / uEnvironmentCSS);
  vec2 rUV = clamp(environmentUV(pixel,max(1.001,uIOR-deltaIOR),amount) + boost,vec2(.001),vec2(.999));
  vec2 bUV = clamp(environmentUV(pixel,min(2.5,uIOR+deltaIOR),amount) - boost,vec2(.001),vec2(.999));
  return vec3(texture(uEnvironment,rUV).r,base.g,texture(uEnvironment,bUV).b);
}

// Dispersion changes the refractive index by wavelength. A small
// normal-directed boost keeps the color separation visible on high-DPR
// screens, without adding a second unrelated magnification field.
vec3 applyDispersion(vec2 pixel, vec3 filtered) {
  if (uChromaticAberration < 0.001 || uRefraction < 0.001) return filtered;
  float radius = shapeMetric(pixel);
  float onset = smoothstep(0.14, 0.72, radius);
  float seat = 1.0-smoothstep(0.88,0.995,radius);
  float strength = sat(uChromaticAberration) * uRefraction * onset * seat;
  if (strength < 0.00001) return filtered;
  // Typical optical glass exhibits modest visible-wavelength dispersion;
  // this range is slightly exaggerated as an adjustable visual effect.
  float deltaIOR = 0.024 * uChromaticAberration;
  vec3 n = normalAt(pixel, radius);
  float slopeMagnitude = length(n.xy);
  vec2 edgeDirection = slopeMagnitude > 0.00001 ? n.xy / slopeMagnitude : vec2(0.0);
  float curvedSurface = smoothstep(0.025, 0.17, slopeMagnitude);
  vec2 boost = edgeDirection * (1.8 * strength * curvedSurface / uSceneCSS);
  vec2 redUV = clamp(sceneUV(pixel, max(1.001,uIOR-deltaIOR)) + boost,
                     vec2(0.002),vec2(0.998));
  vec2 blueUV = clamp(sceneUV(pixel, min(2.5,uIOR+deltaIOR)) - boost,
                      vec2(0.002),vec2(0.998));
  vec3 redSample = texture(uScene,redUV).rgb;
  vec3 blueSample = texture(uScene,blueUV).rgb;
  // The scene is already filtered for green; replace only R/B with their
  // wavelength-offset samples to limit extra mobile GPU texture fetches.
  return vec3(redSample.r, filtered.g, blueSample.b);
}

vec4 sampleAntiAliased(vec2 pixel) {
  if (uAntiAlias < 1.5) return sceneSample(pixel);
  float frostBlur = uFrost * (0.45 + 1.9 * smoothstep(0.72, 0.98, shapeMetric(pixel)));
  float d = max(0.38 / max(uPixelRatio, 1.0), frostBlur);
  vec4 c = vec4(0.0);
  c += sceneSample(pixel + vec2(-d,-d));
  c += sceneSample(pixel + vec2( d,-d));
  c += sceneSample(pixel + vec2(-d, d));
  c += sceneSample(pixel + vec2( d, d));
  return c * 0.25;
}

void main() {
  // vUv's Y axis is screen-up, matching the UNPACK_FLIP_Y scene texture.
  // One coordinate system for scene + moving lens: stage-local CSS pixels,
  // with positive Y pointing up. Input textures were Y-flipped on upload.
  vec3 untouched = texture(uEnvironment, vUv).rgb;
  vec2 pixel = vUv * uViewportCSS - uEnvironmentCenter;
  float r = shapeMetric(pixel);
  float edgeDistance = (r-1.0)*uRadius;
  float blur = max(0.65, uEdgeSoftness) / uPixelRatio;
  float alpha = 1.0 - smoothstep(uOverhang-blur,
                                 uOverhang+blur,edgeDistance);
  if (alpha <= 0.0) {
    fragColor = vec4(untouched, uGlassOnly > 0.5 ? 0.0 : 1.0);
    return;
  }

  vec3 s = surface(r);
  vec3 n = normalAt(pixel, r);
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(cos(uLightAngle)*cos(uLightElevation),
                                sin(uLightAngle)*cos(uLightElevation),
                                sin(uLightElevation)));
  vec3 H = normalize(V + L);
  float f0 = pow((uIOR-1.0)/(uIOR+1.0), 2.0);
  float fresnel = f0 + (1.0-f0)*pow(1.0-sat(dot(n,V)), 5.0);
  // Light, spatially varying polish: reflections respond to an imperfect
  // glass finish, not a second noisy overlay painted onto the dial.
  float localRoughness = uRoughness;
  if (uImperfectionStrength > 0.0) {
    vec2 q = pixel / uRadius;
    float polish = 0.5 + 0.5 * sin(dot(q, vec2(23.0, -17.0)) + 0.27)
                                 * sin(dot(q, vec2(12.0, 27.0)) - 1.1);
    localRoughness = sat(uRoughness +
        uImperfectionStrength * (polish - 0.5) * 0.075);
  }
  float specPower = mix(100.0, 7.0, localRoughness);
  float spec = pow(sat(dot(n,H)), specPower);
  float ambient = sat(dot(n,L));

  if (r >= 1.0) {
    // Transparent, gently raised optical lip OUTSIDE the original clock disk.
    // It is shaded from the same normal field, not a CSS border stroke.
    float edge = 1.0-smoothstep(1.0, 1.0+uOverhang/uRadius+0.003, r);
    vec3 lipColor = mix(uTint*0.58, vec3(0.96,0.985,1.0),
                        sat(spec*0.85 + ambient*0.38 + fresnel*0.45));
    float edgeAlpha = (0.17 + 0.22*spec + 0.12*ambient)*edge;
    // Fullscreen stage output: blend the glass lip over the actual scene
    // exactly once (there is no transparent DOM layer behind this canvas).
    vec3 env = sampleEnvironment(pixel);
    vec3 lipComposite = mix(env, lipColor, sat(edgeAlpha));
    fragColor = vec4(mix(untouched, lipComposite, alpha), uGlassOnly > 0.5 ? alpha * uGlassAlpha : 1.0);
    return;
  }

  vec4 foreground = sampleAntiAliased(pixel);
  vec3 base = applyDispersion(pixel, foreground.rgb);
  // Compositing happens INSIDE WebGL: dial opacity never makes the
  // finished stage canvas translucent. Hands, numerals and grid are sampled
  // from uScene with exactly the same refraction/dispersion as the dial.
  vec3 backdrop = sampleEnvironment(pixel);
  base = mix(backdrop, base, clamp(uClockOpacity * uDialEnabled * foreground.a, 0.0, 1.0));
  // Lower roughness/frost keeps the grid crisp; never blur a second copy of it.
  float transmissionTint = (0.025 + 0.09*sat(uFrost)) * uTintStrength;
  vec3 color = mix(base, uTint, transmissionTint);
  color *= 1.0 - uShading * 0.14 * (1.0-ambient);

  // Shadow/contact near the seating lip; a soft directional shadow makes the
  // front surface read as convex rather than a recessed bowl.
  float contactBand = smoothstep(0.81, 0.985, r) *
                      (1.0-smoothstep(0.99,1.02,r));
  float darkSide = 0.65 + 0.35*sat(0.5 + dot(normalize(pixel+vec2(1e-4)),vec2(0.62,-0.78))*0.5);
  color *= 1.0 - uShadows * 0.13 * contactBand * darkSide;

  // Specular highlight on the same surface that generated the refraction.
  float rimGlow = smoothstep(0.73, 0.98, r) *
                  (1.0-smoothstep(0.98,1.02,r));
  float reflected = uLightIntensity*uHighlights * (0.16*spec + 0.12*fresnel + 0.05*rimGlow*ambient);
  color += vec3(1.0,0.987,0.974) * reflected;

  // Caustic-*style* concentration from the local transmission Jacobian.
  // Not full backward ray tracing; restricted to the translucent lip.
  if (uCaustics > 0.001 && r > 0.69) {
    vec2 radial = normalize(pixel);
    float epsilon = 1.5;
    vec2 a = sourcePosition(pixel + radial*epsilon,uIOR);
    vec2 b = sourcePosition(pixel - radial*epsilon,uIOR);
    float radialStretch = length(a-b)/(2.0*epsilon);
    float tangentStretch = length(sourcePosition(pixel,uIOR))/max(length(pixel),0.001);
    float concentration = sat(1.0/max(radialStretch*tangentStretch,0.5)-1.0);
    float causticBand = smoothstep(0.71, 0.86, r) *
                        (1.0-smoothstep(0.97,1.0,r));
    color += vec3(0.82,0.94,1.0) * uCaustics * concentration * 0.19 * causticBand;
  }

  // Micro rim shadow softens the boundary without drawing a hard line.
  color *= 1.0 - uShadows * 0.055*smoothstep(0.965,1.0,r);
  // Creative grade: exposure and saturation happen only inside the lens.
  color *= pow(2.0,uExposure);
  float luma = dot(color,vec3(0.2126,0.7152,0.0722));
  color = mix(vec3(luma),color,uSaturation);
  float finishAlpha = alpha * (1.0-uEdgeFade*0.45*smoothstep(0.78,1.02,r));
  fragColor = vec4(mix(untouched, clamp(color,0.0,1.0), finishAlpha), uGlassOnly > 0.5 ? alpha * uGlassAlpha : 1.0);
}`;

