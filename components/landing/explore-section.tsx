import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon, type IconName } from "@/components/ui/icon";
import { EXPLORE_CARDS } from "@/lib/constants";

// Photos are matched to EXPLORE_CARDS by index.
const EXPLORE_PHOTOS: { src: string; alt: string; position: string }[] = [
  {
    src: "/images/landing/landing-hero.jpg",
    alt: "A hiker on an alpine meadow trail beneath rocky peaks",
    position: "30% 60%",
  },
  {
    src: "/images/landing/explore-viewpoint.jpg",
    alt: "A summit cairn overlooking a blue lake in a mountain valley",
    position: "50% 60%",
  },
  {
    src: "/images/landing/explore-lake-camp.jpg",
    alt: "An orange tent pitched beside a lake with forested hills",
    position: "30% 70%",
  },
  {
    src: "/images/landing/explore-tea-gardens.jpg",
    alt: "Rolling green hills and tea gardens in soft light",
    position: "center 60%",
  },
];

export function ExploreSection() {
  return (
    <section id="explore" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Discover"
            title="Explore beyond the ordinary"
            description="Find trails, hidden destinations, local events, and outdoor experiences curated by explorers who've already been there."
          />
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {EXPLORE_CARDS.map((card, index) => {
            const photo = EXPLORE_PHOTOS[index];
            return (
              <Reveal key={card.title} delay={index * 70} className="h-full">
                <article className="group relative isolate flex aspect-[4/5] h-full flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] bg-[var(--outly-night)] shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 290px, (min-width: 640px) 45vw, 100vw"
                    style={{ objectPosition: photo.position }}
                    className="-z-10 object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--outly-night)]/90 via-[var(--outly-night)]/20 to-transparent"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {card.category}
                  </span>
                  <div className="flex items-end justify-between gap-3 p-5 text-white">
                    <div>
                      <h3 className="text-xl font-semibold leading-snug">{card.title}</h3>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/80">
                        {card.description}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--outly-purple-dark)] transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    >
                      <Icon name={card.icon as IconName} className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
