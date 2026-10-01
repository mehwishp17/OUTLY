import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * Hero: gradient headline treatment, dual CTAs, and a local adventure photo
 * (`public/images/landing/landing-hero.jpg`). Content rises in and the photo
 * settles from 1.02 to 1 once on load (CSS only).
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--outly-lavender)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl gradient-brand"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[var(--outly-violet)] opacity-20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
        <div className="animate-rise motion-reduce:animate-none">
          <p className="mb-5 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--outly-violet)]/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--outly-purple-dark)]">
            Explore · Connect · Belong
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--outly-ink)] sm:text-5xl lg:text-6xl">
            Find your next{" "}
            <span className="gradient-brand-text">place to explore.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--outly-muted)] sm:text-lg">
            OUTLY helps you discover trails and destinations worth the trip, meet
            like-minded people along the way, and belong to a community built
            around real adventures.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="#explore" size="lg">
              Start exploring
            </Button>
            <Button href="#community" variant="secondary" size="lg">
              Discover communities
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-3 text-sm text-[var(--outly-muted)]">
            <span className="flex -space-x-2" aria-hidden="true">
              {["#351080", "#7c3aed", "#ec4899"].map((color) => (
                <span
                  key={color}
                  className="h-8 w-8 rounded-full border-2 border-[var(--outly-lavender)]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            <span>Join thousands of explorers finding their next adventure.</span>
          </div>
        </div>

        <div className="relative animate-rise [animation-delay:120ms] motion-reduce:animate-none">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-elevated)]">
            <div
              className="relative h-80 w-full sm:h-96"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #351080 0%, #7c3aed 40%, #ec4899 80%, #f6339a 100%)",
              }}
            >
              <Image
                src="/images/landing/landing-hero.jpg"
                alt="A hiker with a red backpack walking a mountain trail toward rocky peaks"
                fill
                priority
                sizes="(min-width: 1024px) 600px, 100vw"
                style={{ objectPosition: "30% 60%" }}
                className="animate-image-settle object-cover motion-reduce:animate-none"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/60 via-transparent to-transparent"
              />
            </div>

            <div className="glass-panel-dark absolute bottom-4 left-4 right-4 flex flex-col gap-3 rounded-[var(--radius-md)] p-4 text-white sm:left-6 sm:right-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-white/70">Trending trail</p>
                <p className="truncate text-sm font-semibold">Sunrise Ridge Trek</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  214 going
                </span>
                <a
                  href="#experiences"
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--outly-purple-dark)] transition-colors hover:bg-[var(--outly-lavender)]"
                >
                  Discover
                  <Icon name="arrow-right" className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
