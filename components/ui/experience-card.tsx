import Image from "next/image";
import type { Experience } from "@/lib/constants";
import { Icon } from "@/components/ui/icon";

/**
 * Card used in the Featured experiences section. The visual area is a local
 * photograph (`image`) over the brand gradient, which remains as the
 * background while the photo loads.
 */
export function ExperienceCard({
  title,
  category,
  location,
  description,
  gradient,
  image,
  imagePosition,
}: Experience) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-all duration-300 group hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.08] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div
        className="relative flex aspect-[4/3] items-end overflow-hidden p-3"
        style={{ backgroundImage: gradient }}
        role="img"
        aria-label={title}
      >
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 900px) 25vw, (min-width: 640px) 50vw, 100vw"
          style={{ objectPosition: imagePosition }}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/55 via-transparent to-transparent"
        />
        <span className="relative rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
          {category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-pink)]">
          <Icon name="pin" className="h-3.5 w-3.5" />
          {location}
        </p>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-white/70">{description}</p>
        <a
          href="/explore"
          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-white transition-colors hover:text-[var(--outly-pink)]"
        >
          Explore on OUTLY
          <Icon name="arrow-right" className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
