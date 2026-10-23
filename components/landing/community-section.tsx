import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

// Compact heading sizes for the landing page (the shared SectionHeading keeps its defaults).
const COMPACT_HEADING =
  "[&_h2]:text-2xl sm:[&_h2]:text-3xl lg:[&_h2]:text-4xl [&_h2+p]:mt-3 [&_h2+p]:text-sm sm:[&_h2+p]:text-base";

// What the community side of OUTLY offers today.
const COMMUNITY_FEATURES: { icon: IconName; title: string; description: string }[] = [
  { icon: "users", title: "Follow explorers", description: "Follow people whose trips inspire you and see what they share." },
  { icon: "tent", title: "Join groups", description: "Find groups around the way you like to explore, or start your own." },
  { icon: "compass", title: "Find a trip partner", description: "Post a partner request for a trip you're planning, or join someone else's." },
  { icon: "message-circle", title: "Chat", description: "Message the people you meet and plan together." },
];

const FRAME = "group relative overflow-hidden rounded-[var(--radius-lg)] border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.4)]";
const ZOOM =
  "object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100";

/**
 * Emphasizes that OUTLY is a community platform, not only a discovery tool. It lists the features that exist
 * (follows, groups, partner requests, chat) next to a photo collage. There are no member counts, names or
 * activity figures.
 */
export function CommunitySection() {
  return (
    <section id="community" className="relative overflow-hidden bg-[var(--outly-night)] py-16 text-white sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="animate-drift-b pointer-events-none absolute -left-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-[var(--outly-pink)] opacity-15 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal visibleByDefault>
            <SectionHeading
              eyebrow="Community"
              title="The best places are better together."
              description="OUTLY connects you with people who share your pace, your interests, and your sense of adventure — so every trip becomes a shared story, not a solo checkbox."
              align="left"
              tone="dark"
              className={COMPACT_HEADING}
            />

            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {COMMUNITY_FEATURES.map((feature) => (
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
              <Button href="/signup" size="md">
                Join the community
              </Button>
            </div>
          </Reveal>

          <Reveal visibleByDefault delay={100}>
            <div className="grid aspect-[5/4] grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
              <figure className={`${FRAME} row-span-2`}>
                <Image
                  src="/images/landing/community-adventure.jpg"
                  alt="A group of hikers walking a mountain trail at golden hour"
                  fill
                  quality={75}
                  sizes="(min-width: 1024px) 26vw, 46vw"
                  style={{ objectPosition: "center 62%" }}
                  className={ZOOM}
                />
              </figure>
              <figure className={FRAME}>
                <Image
                  src="/images/groups/campfire-collective.jpg"
                  alt="A campfire between two green tents with forested mountains behind"
                  fill
                  quality={75}
                  sizes="(min-width: 1024px) 26vw, 46vw"
                  className={ZOOM}
                />
              </figure>
              <figure className={FRAME}>
                <Image
                  src="/images/events/trail-cleanup.jpg"
                  alt="Five friends and a dog walking together along a leaf-covered forest path in autumn"
                  fill
                  quality={75}
                  sizes="(min-width: 1024px) 26vw, 46vw"
                  style={{ objectPosition: "60% 55%" }}
                  className={ZOOM}
                />
              </figure>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
