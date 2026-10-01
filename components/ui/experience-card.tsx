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
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)] transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div
        className="relative flex h-36 items-end overflow-hidden p-4"
        style={{ backgroundImage: gradient }}
        role="img"
        aria-label={title}
      >
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 290px, (min-width: 640px) 45vw, 100vw"
          style={{ objectPosition: imagePosition }}
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/55 via-transparent to-transparent"
        />
        <span className="relative rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
          {category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold text-[var(--outly-ink)]">{title}</h3>
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
          <Icon name="pin" className="h-3.5 w-3.5" />
          {location}
        </p>
        <p className="flex-1 text-sm leading-relaxed text-[var(--outly-muted)]">{description}</p>
        <a
          href="#experiences"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--outly-pink-bright)] transition-colors hover:text-[var(--outly-purple-dark)]"
        >
          View experience
          <Icon name="arrow-right" className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
