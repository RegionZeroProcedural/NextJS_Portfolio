AOS HERO ENTRANCE RESTORATION

Apply on top of the previous AOS hydration-fix patch.

Changed file:
  src/components/AOSProvider.tsx

No changes to page.tsx are needed: hero elements already have data-aos attributes.
Keep src/app/aos-hydration.css from the previous patch and its import in layout.tsx.
Keep AOSProvider wrapping {children} in src/app/layout.tsx.

What it does:
- Initializes AOS after page load and React hydration.
- Restages the hero's AOS classes for one entrance animation instead of
  letting AOS instantly mark all above-the-fold content as animated.
- Leaves scroll reveal behavior and the original OpenGlassUI animations intact.
- Respects prefers-reduced-motion and keeps content visible if AOS fails.

Restart npm run dev and do a hard refresh (Ctrl+Shift+R) to see the entrance.
If you previously pasted custom CSS such as .hero-copy > * { animation: heroReveal ... },
remove it so it does not compete with AOS.
