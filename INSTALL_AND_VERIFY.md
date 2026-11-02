# V20 — mail trigger hides after click animation

**Apply on top of your current V19 portfolio.** Extract this hotfix into the Next.js portfolio root, preserving `src/` paths and replacing the two existing files. No other files need changing.

## Changes
- ContactDock.tsx adds the `mail-dock-motion--hidden` class whenever the contact modal is open. Existing 440 ms click animation runs before `open=true`, so the button only hides after the click animation.
- The button is removed from the tab order while the modal is open and restored when it closes. Existing focus management and Escape handling are preserved.
- mail-trigger-motion.css adds fade/shrink exit and return transitions, and a reduced-motion fallback.
- Removes `data-aos="fade-left"` from the trigger so AOS cannot override the button's own transforms. No other AOS behavior is altered.

## Verify
Run from your portfolio root:

```powershell
Select-String -Path .\src\components\ContactDock.tsx -Pattern 'data-motion-version="v20"'
npm run dev
```

After a click the trigger completes its existing 440 ms press sequence, the modal opens, and the trigger is hidden. Close the modal via X, Escape, or the backdrop to see the trigger return. Refractive glass and EmailJS behavior are unchanged.
