import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type OutlyLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  href?: string;
  priority?: boolean;
  /** Which logo asset to render. `"default"` is the original,
   * project-supplied file (`outly-logo.png`) used everywhere by default.
   * `"transparent"` renders `outly-logo-transparent.png` — the same
   * artwork with only its flat background keyed out to real alpha
   * transparency (no pixel of the mark itself is altered) — for
   * placements where a visible background square would look wrong. */
  variant?: "default" | "transparent";
  /** Next/Image encode quality (1–100). Left unset everywhere except the
   * `"transparent"` placements, which pass 100 so Next's image optimizer
   * re-encodes at full quality instead of compounding the source asset's
   * own compression with further lossy re-encoding at small sizes. */
  quality?: number;
};

const LOGO_SRC: Record<NonNullable<OutlyLogoProps["variant"]>, string> = {
  default: "/images/outly-logo.png",
  transparent: "/images/outly-logo-transparent.png",
};

/**
 * Renders the official OUTLY logo with a fixed aspect ratio so it never
 * stretches or distorts. Pass a smaller `width`/`height` in the footer or
 * navbar as needed — Next/Image will scale proportionally.
 */
export function OutlyLogo({
  className,
  width = 44,
  height = 44,
  href = "/",
  priority = false,
  variant = "default",
  quality,
}: OutlyLogoProps) {
  const mark = (
    <Image
      src={LOGO_SRC[variant]}
      alt="OUTLY — Explore, Connect, Belong"
      width={width}
      height={height}
      priority={priority}
      quality={quality}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );

  if (!href) {
    return mark;
  }

  return (
    <Link href={href} className="inline-flex items-center" aria-label="OUTLY home">
      {mark}
    </Link>
  );
}
