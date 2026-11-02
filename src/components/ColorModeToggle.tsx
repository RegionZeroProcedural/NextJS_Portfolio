"use client";

import { useEffect, useState } from "react";

type ColorMode = "dark" | "light";
const STORAGE_KEY = "portfolio-color-mode";
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => void;
};

function updateColorMode(next: ColorMode, updateMode: (mode: ColorMode) => void) {
  const update = () => {
    document.documentElement.dataset.theme = next;
    updateMode(next);
  };
  const transitionDocument = document as ViewTransitionDocument;
  if (typeof transitionDocument.startViewTransition === "function") {
    transitionDocument.startViewTransition(update);
  } else {
    update();
  }
}

/** Appearance is independent of the accent-color picker and OpenGlassUI Live. */
export function ColorModeToggle() {
  // The server renders the original dark mode. An inline script in layout.tsx
  // restores saved preferences before paint, while this effect syncs the icon.
  const [mode, setMode] = useState<ColorMode>("dark");

  useEffect(() => {
    const updateFromDocument = () => {
      setMode(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    };
    updateFromDocument();
    // If the preference is changed in another tab, update this one too.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = event.newValue === "light" ? "light" : "dark";
      updateColorMode(next, setMode);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggleColorMode() {
    const next: ColorMode = mode === "dark" ? "light" : "dark";
    updateColorMode(next, setMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing / blocked storage: the toggle still works this session.
    }
  }

  return (
    <button
      type="button"
      className="color-mode-toggle"
      onClick={toggleColorMode}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      aria-pressed={mode === "light"}
      title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      <span className="color-mode-icon" aria-hidden="true">
        {mode === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 14a8.7 8.7 0 0 1-10.8-10.8A8.7 8.7 0 1 0 20.8 14Z" />
          </svg>
        )}
      </span>
    </button>
  );
}
