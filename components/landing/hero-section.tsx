import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { COMMUNITY_MEMBERS, COMMUNITY_STATS } from "@/lib/constants";

/**
 * Immersive hero: a full-bleed trail photo sits behind the (transparent)
 * navbar, with a brand-colour scrim for text legibility. Content rises in
 * and the photo settles once on load (CSS only).
 */
export function HeroSection() {
  return (
    <section className="relative -mt-20 overflow-hidden bg-[var(--outly-night)] md:-mt-24">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "var(--gradient-night)" }}
      >
        <Image
          src="/images/landing/hero-peaks.jpg"
          alt="Two hikers with backpacks walking a mountain trail toward snow-capped peaks"
          fill
          priority
          sizes="100vw"
          style={{ objectPosition: "50% 40%" }}
          className="animate-image-settle object-cover motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[var(--outly-night)]/85 via-[var(--outly-night)]/45 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/70 via-transparent to-[var(--outly-night)]/40"
        />
      </div>

      <div className="relative mx-auto flex min-h-[40rem] max-w-7xl flex-col justify-center gap-10 px-4 pb-14 pt-32 sm:px-6 md:min-h-[44rem] md:pt-36 lg:min-h-[48rem] lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:pb-16">
        <div className="max-w-2xl animate-rise motion-reduce:animate-none">
          <p className="mb-6 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            Explore · Connect · Belong
          </p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find your next{" "}
            <span className="bg-gradient-to-r from-[var(--outly-violet)] to-[var(--outly-pink)] bg-clip-text text-transparent">
              place to explore.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            OUTLY helps you discover trails and destinations worth the trip, meet
            like-minded people along the way, and belong to a community built
            around real adventures.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#explore" size="lg">
              Start exploring
              <Icon name="arrow-right" className="h-4 w-4" />
            </Button>
            <Button
              href="#community"
              variant="ghost"
              size="lg"
              className="border border-white/40 text-white backdrop-blur-sm hover:bg-white/15"
            >
              Discover communities
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-white/80">
            <ul className="flex -space-x-2" aria-hidden="true">
              {COMMUNITY_MEMBERS.slice(0, 4).map((member) => (
                <li
                  key={member.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 text-[10px] font-semibold text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${member.gradientFrom}, ${member.gradientTo})`,
                  }}
                >
                  {member.initials}
                </li>
              ))}
            </ul>
            <span>Join thousands of explorers finding their next adventure.</span>
          </div>
        </div>

        <dl className="glass-panel-dark grid animate-rise grid-cols-3 gap-4 rounded-[var(--radius-md)] p-5 text-white [animation-delay:160ms] motion-reduce:animate-none sm:gap-6 sm:p-6 lg:w-80 lg:grid-cols-1 lg:gap-5">
          {COMMUNITY_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse lg:flex-row lg:items-baseline lg:justify-between lg:gap-4">
              <dt className="mt-0.5 text-xs text-white/70 lg:mt-0 lg:text-sm">{stat.label}</dt>
              <dd className="text-2xl font-bold sm:text-3xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
