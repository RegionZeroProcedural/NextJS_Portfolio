"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeControl } from "@/components/ThemeControl";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { SHADER_STATUS_EVENT, type ShaderStatus } from "@/lib/openglassui/shaderStatus";

const navigation = [
  { label: "Home", id: "home" },
  { label: "Projects", id: "projects" },
  { label: "Skills", id: "skills" },
  { label: "Experience", id: "experience" },
  { label: "About", id: "about" },
  { label: "Contact", id: "contact" },
];

export function Header() {
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [shaderStatus, setShaderStatus] = useState<ShaderStatus>({ phase: "idle", label: "ON DEMAND" });
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sections = navigation
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.1, 0.3, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    const update = (event: Event) => {
      setShaderStatus((event as CustomEvent<ShaderStatus>).detail);
    };
    window.addEventListener(SHADER_STATUS_EVENT, update);
    return () => window.removeEventListener(SHADER_STATUS_EVENT, update);
  }, []);

  const loadingShader = ["queued", "creating", "compiling", "linking"].includes(shaderStatus.phase);
  return (
    <header className="site-header">
      <div className="header-shader-status" role="status" aria-live="polite">
        <span className="header-shader-label mono">{loadingShader ? "LOADING SHADER" : "SHADER"} <b>{shaderStatus.label}</b></span>
        <span className={`header-shader-track${loadingShader ? " is-loading" : ""}${shaderStatus.phase === "ready" ? " is-ready" : ""}`} aria-hidden="true">
          <span />
        </span>
      </div>
      <a className="header-brand" href="#home" aria-label="Keegan LaBrot, home">KL<span>.</span></a>
      <button
        className="menu-toggle"
        ref={menuToggleRef}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span>{menuOpen ? "Close" : "Menu"}</span>
        <span className="menu-icon" aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
      </button>
      <nav className={`main-nav${menuOpen ? " nav-open" : ""}`} id="primary-navigation" aria-label="Main navigation">
        {navigation.map(({ label, id }) => (
          <a
            aria-current={activeSection === id ? "location" : undefined}
            className={activeSection === id ? "nav-active" : undefined}
            href={`#${id}`}
            key={id}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </a>
        ))}
        <ThemeControl compact />
      </nav>
      <ColorModeToggle />
    </header>
  );
}
