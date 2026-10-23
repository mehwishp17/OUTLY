import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

// Compact heading sizes for the landing page (the shared SectionHeading keeps its defaults).
const COMPACT_HEADING =
  "[&_h2]:text-2xl sm:[&_h2]:text-3xl lg:[&_h2]:text-4xl [&_h2+p]:mt-3 [&_h2+p]:text-sm sm:[&_h2+p]:text-base";

type Moment = {
  src: string;
  alt: string;
  caption: string;
  position?: string;
  /** Tile placement on the md+ grid (4 columns, 2 rows). */
  span: string;
  /** Aspect ratio on small screens, where the tiles sit in two columns. */
  aspect: string;
};

// Real photographs with short descriptive captions: no names, quotes or counts.
const MOMENTS: Moment[] = [
  {
    src: "/images/events/kedarkantha-winter-trek.jpg",
    alt: "Four hikers with backpacks walking a grassy ridge path toward misty mountains",
    caption: "Walking the ridge together",
    position: "50% 60%",
    span: "order-1 md:order-none md:row-span-2",
    aspect: "aspect-[3/4]",
  },
  {
    src: "/images/places/dehradun-cycling.jpg",
    alt: "Two mountain bikers riding a gravel ridge above a colourful alpine valley",
    caption: "Ridge rides",
    position: "35% 60%",
    span: "order-3 col-span-2 md:order-none",
    aspect: "aspect-[16/10]",
  },
  {
    src: "/images/activities/sinhagad-weekend-hike.jpg",
    alt: "Two hikers with trekking poles crossing a green mountain meadow beside a still pond",
    caption: "Quiet mountain mornings",
    position: "50% 55%",
    span: "order-2 md:order-none md:row-span-2",
    aspect: "aspect-[3/4]",
  },
  {
    src: "/images/places/bandipur-wildlife.jpg",
    alt: "Spotted deer grazing in a misty forest with sunbeams through the trees",
    caption: "Wildlife at first light",
    position: "55% 60%",
    span: "order-4 md:order-none",
    aspect: "aspect-[4/3]",
  },
  {
    src: "/images/activities/tea-gardens-walk.jpg",
    alt: "Fresh green tea leaves in the foreground with tea-covered hills behind",
    caption: "Among the tea hills",
    position: "50% 45%",
    span: "order-5 md:order-none",
    aspect: "aspect-[4/3]",
  },
];

/**
 * "Stories" as a photo gallery. The earlier invented testimonials are gone: the photographs carry the
 * mood, with plain captions and no people, quotes or figures. `id="stories"` stays for the navbar link.
 */
export function StoriesSection() {
  return (
    <section id="stories" className="relative overflow-hidden bg-[var(--outly-night)] py-16 text-white sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="animate-drift-a pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[var(--outly-pink)] opacity-15 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal visibleByDefault>
          <SectionHeading
            eyebrow="Stories"
            title="Adventures worth sharing"
            description="Every great trip starts with a place, good company, and a photo you can't wait to share."
            tone="dark"
            className={COMPACT_HEADING}
          />
        </Reveal>

        <Reveal visibleByDefault delay={80} className="mt-10">
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:aspect-[16/9] md:grid-cols-4 md:grid-rows-2">
            {MOMENTS.map((moment) => (
              <li
                key={moment.src}
                className={cn(
                  "group relative overflow-hidden rounded-[var(--radius-lg)] border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.4)] md:aspect-auto",
                  moment.aspect,
                  moment.span,
                )}
              >
                <Image
                  src={moment.src}
                  alt={moment.alt}
                  fill
                  quality={75}
                  sizes="(min-width: 1024px) 28vw, (min-width: 768px) 30vw, 50vw"
                  style={{ objectPosition: moment.position }}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/80 via-transparent to-transparent"
                />
                <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">{moment.caption}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal visibleByDefault delay={120} className="mt-10 flex justify-center">
          <Button href="/signup" variant="secondary" size="md">
            Start your own story
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
