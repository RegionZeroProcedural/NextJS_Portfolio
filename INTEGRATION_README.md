# V18 — Mail dock hover & click animation (safe component-only patch)

Based on the V17 portfolio source. The patch modifies **only**:

- `src/components/ContactDock.tsx`: adds a short tactile press animation before the modal opens and decorative rings; all EmailJS validation and sending logic preserved.
- `src/components/ContactDockMotion.module.css`: scoped CSS animations for hover elevation, sweep, envelope tilt, click ripple, and modal entrance.

Because this is a CSS Module imported by `ContactDock.tsx`, your `layout.tsx`, AOS setup, theme styles, shader, and existing customized global CSS remain untouched.

## Install

Extract the hotfix into your Next.js root, preserving `src/components/...`. Overwrite `ContactDock.tsx` and add the CSS module. Restart `npm run dev` and refresh.

Keyboard click works. For visitors who request reduced motion, the form opens immediately. The modal and floating background animations are otherwise unchanged.
