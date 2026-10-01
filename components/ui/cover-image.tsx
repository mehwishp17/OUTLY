import Image from "next/image";
import { cn } from "@/lib/utils";

type CoverImageProps = {
  src: string;
  sizes: string;
  /** CSS object-position, e.g. "30% center", to keep the subject in frame. */
  position?: string;
  className?: string;
};

/** Decorative local photo that fills its parent. The parent must be
 * `relative overflow-hidden`; add `group` to it for the hover zoom. The
 * parent keeps its accessible label, so the image itself is `alt=""`. */
export function CoverImage({ src, sizes, position = "center", className }: CoverImageProps) {
  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        quality={100}
        style={{ objectPosition: position }}
        className={cn(
          "object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
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
