import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { EXPLORE_CARDS } from "@/lib/constants";

// Compact heading sizes for the landing page (the shared SectionHeading keeps its defaults).
const COMPACT_HEADING =
  "[&_h2]:text-2xl sm:[&_h2]:text-3xl lg:[&_h2]:text-4xl [&_h2+p]:mt-3 [&_h2+p]:text-sm sm:[&_h2+p]:text-base";

// Photos are matched to EXPLORE_CARDS by index. All are landscape, so the 4:3 frame never crops a
// portrait shot; `position` keeps each subject in frame.
const EXPLORE_PHOTOS: { src: string; alt: string; position: string }[] = [
  {
    src: "/images/landing/hero-peaks.jpg",
    alt: "Two hikers with backpacks walking a mountain path toward snow-capped peaks",
    position: "55% 55%",
  },
  {
    src: "/images/landing/explore-viewpoint.jpg",
    alt: "A summit cairn overlooking a blue lake in a mountain valley",
    position: "50% 60%",
  },
  {
    src: "/images/events/sinhagad-group-hike.jpg",
    alt: "A group of hikers walking up a forest path toward a waterfall",
    position: "50% 60%",
  },
  {
    src: "/images/groups/foothill-cyclists.jpg",
    alt: "A mountain biker pausing on an alpine meadow to look at jagged peaks",
    position: "45% 55%",
  },
];

/**
 * Photo-first discovery tiles. Each card opens the matching area of OUTLY (signed-out visitors are sent to
 * log in first), so every card leads somewhere real.
 */
export function ExploreSection() {
  return (
    <section id="explore" className="relative overflow-hidden bg-[var(--outly-ink)] py-16 text-white sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="animate-drift-a pointer-events-none absolute -right-40 -top-32 h-96 w-96 rounded-full bg-[var(--outly-violet)] opacity-20 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal visibleByDefault>
          <SectionHeading
            eyebrow="Discover"
            title="Explore beyond the ordinary"
            description="Trails, viewpoints and campsites on a real map, plus group events and activities to join."
            tone="dark"
            className={COMPACT_HEADING}
          />
        </Reveal>

        <div className="mt-10 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE_CARDS.map((card, index) => {
            const photo = EXPLORE_PHOTOS[index];
            return (
              <Reveal key={card.title} visibleByDefault delay={index * 70} className="h-full">
                <a
                  href={card.href}
                  className="group flex h-full flex-col rounded-[var(--radius-md)] transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--outly-night)] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      quality={75}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      style={{ objectPosition: photo.position }}
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/55 via-transparent to-transparent"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-[var(--shadow-soft)] gradient-brand"
                    >
                      <Icon name={card.icon} className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-4 flex flex-1 flex-col">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--outly-pink)]">
                      {card.category}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{card.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/70">{card.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white transition-colors group-hover:text-[var(--outly-pink)]">
                      Open
                      <Icon
                        name="arrow-right"
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      />
                    </span>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
