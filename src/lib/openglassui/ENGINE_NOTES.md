# OpenGlassUI integration

`GlassRenderer.js`, `shaders.js`, and `presets.js` are copied without modification
from the independently developed OpenGlassUI v11 source archive supplied for
this portfolio. They remain React-independent. `GlassStage.tsx` adapts them to
an on-demand Next.js Client Component: it draws its own stage-local 2D test
pattern and passes it into the original WebGL2 optics renderer as texture 0.
Unlike an arbitrary HTML screen-capture effect, the shader refracts only the
stage image supplied to it. Buttons, badges, and tags use deliberately subtle
CSS glass-inspired gradients, highlights, and backdrop blur rather than
pretending to perform GPU refraction of arbitrary page DOM.

The stage only renders while near the viewport and on settings, pointer, or
size changes. It does not run a continuous rendering loop. The lens can be
moved with a pointer or focused canvas arrow keys (Shift for larger steps).
