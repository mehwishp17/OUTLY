import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

// Compact heading sizes for the landing page (the shared SectionHeading keeps its defaults).
const COMPACT_HEADING =
  "[&_h2]:text-2xl sm:[&_h2]:text-3xl lg:[&_h2]:text-4xl [&_h2+p]:mt-3 [&_h2+p]:text-sm sm:[&_h2+p]:text-base";

// The sharing features OUTLY has today: photo posts, likes and comments, and saving.
const SHARE_FEATURES: { icon: IconName; title: string; description: string }[] = [
  { icon: "camera", title: "Post your photos", description: "Share pictures and a few words from the trail." },
  { icon: "heart", title: "Like and comment", description: "React to what other explorers share and start a conversation." },
  { icon: "bookmark", title: "Save what you find", description: "Keep posts and places you want to come back to." },
];

const FRAME = "group relative overflow-hidden rounded-[var(--radius-lg)] border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.4)]";
const ZOOM =
  "object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100";
const CHIP =
  "glass-panel-dark absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold";

/**
 * Photo-led introduction to sharing on OUTLY. The photos are stock photography and each chip names a
 * feature; there are no invented posts, people, likes or comment counts.
 */
export function ShareSection() {
  return (
    <section id="share" className="relative overflow-hidden bg-[var(--outly-ink)] py-16 text-white sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="animate-drift-a pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[var(--outly-violet)] opacity-20 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal visibleByDefault className="order-2 lg:order-1">
            <div className="grid aspect-[5/4] grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
              <figure className={`${FRAME} row-span-2`}>
                <Image
                  src="/images/landing/explore-lake-camp.jpg"
                  alt="An orange tent on a grassy lakeshore with misty green hills beyond"
                  fill
                  quality={75}
                  sizes="(min-width: 1024px) 26vw, 46vw"
                  style={{ objectPosition: "30% 70%" }}
                  className={ZOOM}
                />
                <figcaption className={CHIP}>
                  <Icon name="camera" className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
                  Photo posts
                </figcaption>
              </figure>
              <figure className={FRAME}>
                <Image
                  src="/images/activities/sunrise-ridge-trek.jpg"
                  alt="Golden sunlight breaking through cloud over a rocky, tree-lined ridge"
                  fill
                  quality={75}
                  sizes="(min-width: 1024px) 26vw, 46vw"
                  className={ZOOM}
                />
                <figcaption className={CHIP}>
                  <Icon name="heart" className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
                  Likes and comments
                </figcaption>
              </figure>
              <figure className={FRAME}>
                <Image
                  src="/images/landing/explore-tea-gardens.jpg"
                  alt="Rolling green hills and tea gardens in soft light"
                  fill
                  quality={75}
                  sizes="(min-width: 1024px) 26vw, 46vw"
                  style={{ objectPosition: "center 60%" }}
                  className={ZOOM}
                />
                <figcaption className={CHIP}>
                  <Icon name="bookmark" className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
                  Saved posts
                </figcaption>
              </figure>
            </div>
          </Reveal>

          <Reveal visibleByDefault delay={100} className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Share"
              title="Share what you find."
              description="A trip is better with a story to go with it. Post photos from the places you explore and see what other people are discovering."
              align="left"
              tone="dark"
              className={COMPACT_HEADING}
            />

            <ul className="mt-8 flex flex-col gap-5">
              {SHARE_FEATURES.map((feature) => (
                <li key={feature.title} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white gradient-brand"
                  >
                    <Icon name={feature.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/65">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button href="/signup" variant="secondary" size="md">
                Join and start sharing
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
