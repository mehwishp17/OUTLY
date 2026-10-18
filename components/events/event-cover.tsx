"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type EventCoverProps = {
  /** The organizer-uploaded cover image URL served by the backend. */
  src: string;
  alt: string;
  className?: string;
};

/** Fills its `relative overflow-hidden` parent with the event's cover image,
 * cropped with `object-cover`. If the file fails to load, it renders nothing,
 * so the parent's category gradient shows instead of a broken image. */
export function EventCover({ src, alt, className }: EventCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (failedSrc === src) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- backend-served upload at an arbitrary origin. */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          className,
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/55 via-transparent to-transparent"
      />
    </>
  );
}
