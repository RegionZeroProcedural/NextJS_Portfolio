"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AOSProvider() {
  const pathname = usePathname();

  // Initialize AOS once
  useEffect(() => {
    let mounted = true;
    let animationFrame = 0;

    const initializeAOS = async () => {
      try {
        const { default: AOS } = await import("aos");

        if (!mounted) return;

        AOS.init({
          duration: 750,
          easing: "ease-out-cubic",
          once: true,
          offset: 30,
          delay: 0,
          mirror: false,
          anchorPlacement: "top-bottom",
          disable: () =>
            window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches,
        });

        animationFrame = requestAnimationFrame(() => {
          if (!mounted) return;

          AOS.refreshHard();
        });
      } catch (error) {
        console.error("AOS initialization failed:", error);

        // Ensure content remains visible if AOS fails
        document.querySelectorAll("[data-aos]").forEach((element) => {
          element.classList.remove("aos-init", "aos-animate");
          element.removeAttribute("data-aos");
        });
      }
    };

    initializeAOS();

    return () => {
      mounted = false;
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Refresh positions when Next.js changes routes
  useEffect(() => {
    let cancelled = false;

    const refreshAOS = async () => {
      const { default: AOS } = await import("aos");

      if (cancelled) return;

      requestAnimationFrame(() => {
        if (!cancelled) AOS.refreshHard();
      });
    };

    refreshAOS().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}