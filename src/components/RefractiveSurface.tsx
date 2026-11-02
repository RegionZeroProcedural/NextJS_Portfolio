import type { ReactNode } from "react";

type SurfaceVariant = "about" | "inspector" | "metrics" | "toolbar" | "header" | "chip";

type Props = {
  variant: SurfaceVariant;
  className?: string;
  children?: ReactNode;
};

/**
 * Compositor-only glass: no canvas, no shader, no CPU pixel readback, no
 * initialization effects. The native backdrop filter samples the real DOM
 * pixels behind this element each time the browser composites the page.
 *
 * The page defines shared SVG backdrop displacement filters. Once the
 * OpenGlassUI demo reaches READY, selected visible ambient panes and buttons
 * use those filters to bend actual DOM pixels behind them in Chromium.
 * Other browsers keep native blur. No repeated DOM captures or additional
 * WebGL contexts are created while scrolling.
 */
export function RefractiveSurface({ variant, className = "", children }: Props) {
  return (
    <div className={`refractive-surface refractive-${variant} ${className}`}>
      <div className="refractive-content">{children}</div>
    </div>
  );
}
