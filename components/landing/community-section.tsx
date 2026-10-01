import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { COMMUNITY_MEMBERS, COMMUNITY_STATS } from "@/lib/constants";

/**
 * Emphasizes that OUTLY is a community platform, not only a discovery
 * tool: member avatars, group stats, and an activity preview card.
 */
export function CommunitySection() {
  return (
    <section id="community" className="bg-[var(--outly-night)] py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Community"
              title="The best places are better together."
              description="OUTLY connects you with people who share your pace, your interests, and your sense of adventure — so every trip becomes a shared story, not a solo checkbox."
              align="left"
              tone="dark"
            />

            <dl className="mt-10 grid grid-cols-3 gap-6">
              {COMMUNITY_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs uppercase tracking-wide text-white/50">{stat.label}</dt>
                  <dd className="mt-1 text-2xl font-bold gradient-brand-text">{stat.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-white/40">Illustrative figures for preview purposes.</p>
          </div>

          <div className="glass-panel-dark overflow-hidden rounded-[var(--radius-lg)] p-6 sm:p-8">
            <div className="relative -mx-6 -mt-6 mb-6 h-44 sm:-mx-8 sm:-mt-8 sm:mb-8 sm:h-52">
              <Image
                src="/images/landing/community-adventure.jpg"
                alt="A group of hikers walking a mountain trail at golden hour"
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                style={{ objectPosition: "center 64%" }}
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--outly-night)]/50 via-transparent to-transparent"
              />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Weekend Ridge Trekkers
              </h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                Active group
              </span>
            </div>

            <ul className="mt-6 flex -space-x-3" aria-label="Group members">
              {COMMUNITY_MEMBERS.map((member) => (
                <li
                  key={member.name}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--outly-night)] text-xs font-semibold text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${member.gradientFrom}, ${member.gradientTo})`,
                  }}
                >
                  <span aria-hidden="true">{member.initials}</span>
                  <span className="sr-only">{member.name}</span>
                </li>
              ))}
              <li className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--outly-night)] bg-white/10 text-xs font-semibold text-white">
                <span aria-hidden="true">+38</span>
                <span className="sr-only">and 38 more members</span>
              </li>
            </ul>

            <p className="mt-6 text-sm leading-relaxed text-white/70">
              43 members are joining this Saturday&rsquo;s sunrise trek. RSVP to get trail
              notes, carpool coordination, and the group chat link.
            </p>

            <div className="mt-6 flex items-center justify-between rounded-[var(--radius-md)] bg-white/5 p-4">
              <span className="text-sm text-white/70">Next event</span>
              <span className="text-sm font-semibold text-white">Sat, 5:30 AM · Trailhead</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
