"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type PostMediaProps = {
  images: string[];
  /** Describes the photos for screen readers (the author and place). */
  alt: string;
  /** When set, the photos link to the post's detail page. */
  href?: string;
  className?: string;
};

/**
 * A post's photos. One photo is shown whole (never cropped) over a soft blurred copy of itself, so
 * landscape and portrait shots both fill the width cleanly. Several photos become a swipeable carousel
 * with a counter, dots and previous/next buttons; it also works with the arrow keys.
 */
export function PostMedia({ images, alt, href, className }: PostMediaProps) {
  if (images.length === 1) return <SinglePhoto src={images[0]} alt={alt} href={href} className={className} />;
  return <PhotoCarousel images={images} alt={alt} href={href} className={className} />;
}

function SinglePhoto({ src, alt, href, className }: { src: string; alt: string; href?: string; className?: string }) {
  const content = (
    <div className={cn("relative isolate flex items-center overflow-hidden bg-[#0d0616]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- photo served by the backend (a different origin than the app). */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-45 blur-2xl"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- photo served by the backend (a different origin than the app). */}
      <img src={src} alt={alt} loading="lazy" className="relative mx-auto max-h-[36rem] w-full object-contain" />
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function PhotoCarousel({ images, alt, href, className }: PostMediaProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = images.length - 1;

  function goTo(next: number) {
    const el = scroller.current;
    if (!el) return;
    const clamped = Math.min(Math.max(next, 0), last);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: clamped * el.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function handleScroll() {
    const el = scroller.current;
    if (el && el.clientWidth > 0) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
  }

  const arrow =
    "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-opacity hover:bg-black/75 focus-visible:opacity-100 md:flex md:opacity-0 md:group-hover/media:opacity-100 md:group-focus-within/media:opacity-100 motion-reduce:transition-none";

  return (
    <div className={cn("group/media relative bg-[#0d0616]", className)}>
      <div
        ref={scroller}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${images.length} photos. Use the left and right arrow keys to browse.`}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => {
          const slide = (
            // eslint-disable-next-line @next/next/no-img-element -- photo served by the backend (a different origin than the app).
            <img src={src} alt={`${alt} (${i + 1} of ${images.length})`} loading="lazy" className="h-full w-full object-cover" />
          );
          return (
            <div
              key={src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
              className="relative aspect-square w-full shrink-0 snap-center"
            >
              {href ? (
                <Link href={href} tabIndex={-1} className="block h-full w-full">
                  {slide}
                </Link>
              ) : (
                slide
              )}
            </div>
          );
        })}
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"
      >
        {index + 1}/{images.length}
      </span>

      {index > 0 ? (
        <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous photo" className={cn(arrow, "left-3")}>
          <Icon name="chevron-left" className="h-5 w-5" />
        </button>
      ) : null}
      {index < last ? (
        <button type="button" onClick={() => goTo(index + 1)} aria-label="Next photo" className={cn(arrow, "right-3")}>
          <Icon name="chevron-left" className="h-5 w-5 rotate-180" />
        </button>
      ) : null}

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {images.map((src, i) => (
          <span
            key={src}
            className={cn(
              "h-1.5 rounded-full transition-all motion-reduce:transition-none",
              i === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
