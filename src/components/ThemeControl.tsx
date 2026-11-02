"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const accents = [
  { name: "Ice blue", value: "#68c9ff" },
  { name: "Violet", value: "#b19aff" },
  { name: "Mint", value: "#57e6ba" },
];

const defaultAccent = accents[0];
const accentEvent = "portfolio-accent-change";

function getAccentSnapshot() {
  const saved = window.localStorage.getItem("portfolio-accent");
  return accents.find((option) => option.value === saved)?.value ?? defaultAccent.value;
}

function subscribeToAccent(onChange: () => void) {
  window.addEventListener(accentEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(accentEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const selectedValue = useSyncExternalStore(
    subscribeToAccent,
    getAccentSnapshot,
    () => defaultAccent.value,
  );
  const selected = accents.find((accent) => accent.value === selectedValue) ?? defaultAccent;

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", selected.value);
  }, [selected.value]);

  function chooseAccent(accent: (typeof accents)[number]) {
    window.localStorage.setItem("portfolio-accent", accent.value);
    window.dispatchEvent(new Event(accentEvent));
  }

  return (
    <div className={`theme-control${compact ? " theme-compact" : ""}`}>
      <button
        className="theme-trigger"
        type="button"
        aria-expanded={open}
        aria-label="Customize accent color"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="theme-swatch" style={{ backgroundColor: selected.value }} />
        <span>{compact ? "Theme" : "Accent color"}</span>
      </button>
      {open && (
        <div className="theme-options" role="group" aria-label="Choose an accent color">
          {accents.map((accent) => (
            <button
              aria-label={accent.name}
              aria-pressed={selected.value === accent.value}
              className="accent-option"
              key={accent.value}
              onClick={() => chooseAccent(accent)}
              style={{ backgroundColor: accent.value }}
              title={accent.name}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
