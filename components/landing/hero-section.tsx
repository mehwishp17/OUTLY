import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";

// What you can do on OUTLY today: labels only, no figures.
const HIGHLIGHTS: { icon: IconName; label: string }[] = [
  { icon: "trail", label: "Trails and places" },
  { icon: "calendar", label: "Group events" },
  { icon: "users", label: "Groups and partners" },
  { icon: "message-circle", label: "Chat" },
];

/**
 * Cinematic hero: a full-bleed trail photo (`landing-hero.jpg`) under a dark gradient, the headline and
 * both calls to action on the left, and two framed photos on large screens. Content rises in with a short
 * stagger and the photo settles once on load; two soft glows drift very slowly. Everything is CSS and
 * transform/opacity only, and is switched off by `prefers-reduced-motion`. The text is in the HTML from the
 * start, so nothing waits on JavaScript.
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--outly-night)] text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/landing/landing-hero.jpg"
          alt="A hiker with a red backpack walking a mountain trail toward rocky peaks"
          fill
          priority
          quality={75}
          sizes="100vw"
          style={{ objectPosition: "30% 55%" }}
          className="animate-image-settle object-cover motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[var(--outly-night)] via-[var(--outly-night)]/80 to-[var(--outly-night)]/30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[var(--outly-night)] via-transparent to-[var(--outly-night)]/40"
        />
      </div>
      <div
        aria-hidden="true"
        className="animate-drift-a pointer-events-none absolute -left-32 top-8 -z-10 h-[28rem] w-[28rem] rounded-full bg-[var(--outly-violet)] opacity-30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-drift-b pointer-events-none absolute -right-24 bottom-0 -z-10 h-96 w-96 rounded-full bg-[var(--outly-pink)] opacity-20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className="animate-rise inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 motion-reduce:animate-none">
            Explore · Connect · Belong
          </p>
          <h1 className="animate-rise mt-5 text-4xl font-bold leading-[1.05] tracking-tight [animation-delay:80ms] motion-reduce:animate-none sm:text-5xl lg:text-6xl xl:text-7xl">
            Find your next{" "}
            <span className="bg-gradient-to-r from-[var(--outly-pink)] via-[var(--outly-pink-bright)] to-[var(--outly-violet)] bg-clip-text text-transparent">
              place to explore.
            </span>
          </h1>
          <p className="animate-rise mt-5 max-w-xl text-base leading-relaxed text-white/80 [animation-delay:160ms] motion-reduce:animate-none sm:text-lg">
            OUTLY helps you discover trails and destinations worth the trip, meet like-minded people along the way,
            and belong to a community built around real adventures.
          </p>

          <div className="animate-rise mt-8 flex flex-col gap-3 [animation-delay:240ms] motion-reduce:animate-none sm:flex-row">
            <Button href="/signup" size="lg">
              Create your account
            </Button>
            <Button href="#explore" variant="secondary" size="lg">
              Explore places
            </Button>
          </div>

          <ul
            aria-label="What you can do on OUTLY"
            className="animate-rise mt-8 flex flex-wrap gap-2 [animation-delay:320ms] motion-reduce:animate-none"
          >
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85"
              >
                <Icon name={item.icon} className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise hidden flex-col gap-4 [animation-delay:200ms] motion-reduce:animate-none lg:flex">
          <figure className="group relative w-11/12 self-start overflow-hidden rounded-[var(--radius-lg)] border border-white/15 shadow-[var(--shadow-elevated)]">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/groups/weekend-wanderers.jpg"
                alt="Three hikers in helmets looking down at a turquoise lake from a cliff path"
                fill
                quality={75}
                sizes="(min-width: 1280px) 30vw, 38vw"
                style={{ objectPosition: "55% 60%" }}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/70 via-transparent to-transparent"
              />
            </div>
            <figcaption className="glass-panel-dark absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold">
              Explore with other people
            </figcaption>
          </figure>
          <figure className="group relative w-3/4 self-end overflow-hidden rounded-[var(--radius-lg)] border border-white/15 shadow-[var(--shadow-elevated)]">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/groups/trail-runners.jpg"
                alt="Trail runners on a narrow forest path among spring flowers"
                fill
                quality={75}
                sizes="(min-width: 1280px) 22vw, 28vw"
                style={{ objectPosition: "45% 40%" }}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/70 via-transparent to-transparent"
              />
            </div>
            <figcaption className="glass-panel-dark absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold">
              Find your pace
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
