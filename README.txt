Fix: Next.js AOS React hydration mismatch caused by AOS adding aos-init classes before page hydration.

Install: Extract into your existing portfolio root, preserving paths.
Files modified:
  src/components/AOSProvider.tsx
  src/app/layout.tsx
Added:
  src/app/aos-hydration.css

The provider now wraps the content, initializes AOS once after load + 2 frames,
disables AOS automatic DOM mutation observation, and calls refreshHard on route
changes. CSS keeps server-rendered content visible until AOS is ready.

Restart dev server and hard refresh. If stale: stop dev server, remove .next,
and run npm run dev.

No edits to OpenGlassUI shaders, floating glass animations, EmailJS or theme styles.
