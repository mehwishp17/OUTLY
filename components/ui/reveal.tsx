"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  /** Extra delay in ms, used to stagger siblings (roughly 50-80ms apart). */
  delay?: number;
  /** Starting offset in px (default 12). */
  distance?: number;
  /** Duration in ms (default 600). */
  duration?: number;
  className?: string;
  /**
   * Keep the content visible in the server HTML (and if scripts fail). It is hidden, then revealed on
   * scroll, only when it starts below the fold; content already on screen is left alone. Without
   * this, content starts hidden and fades in (the original behaviour, used by the feed).
   */
  visibleByDefault?: boolean;
};

/**
 * Fades and lifts its content into place (12px, ~600ms) the first time it
 * scrolls into view. The hidden/visible styles live in `globals.css`
 * (`.reveal` / `.reveal.is-visible`), which also turns the effect off under
 * `prefers-reduced-motion`. Plays once; never loops.
 */
export function Reveal({ children, delay = 0, distance, duration, className, visibleByDefault = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (visibleByDefault) {
      if (element.getBoundingClientRect().top < window.innerHeight) {
        element.classList.add("is-visible"); // already on screen: nothing to animate
        return;
      }
      element.classList.add("is-armed");
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visibleByDefault]);

  return (
    <div
      ref={ref}
      className={cn(visibleByDefault ? "reveal-soft" : "reveal", className)}
      style={
        {
          ...(delay ? { transitionDelay: `${delay}ms` } : {}),
          ...(distance !== undefined ? { "--reveal-y": `${distance}px` } : {}),
          ...(duration !== undefined ? { "--reveal-ms": `${duration}ms` } : {}),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
