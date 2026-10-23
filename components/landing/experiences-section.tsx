import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExperienceCard } from "@/components/ui/experience-card";
import { EXPERIENCES } from "@/lib/constants";

// Compact heading sizes for the landing page (the shared SectionHeading keeps its defaults).
const COMPACT_HEADING =
  "[&_h2]:text-2xl sm:[&_h2]:text-3xl lg:[&_h2]:text-4xl [&_h2+p]:mt-3 [&_h2+p]:text-sm sm:[&_h2+p]:text-base";

export function ExperiencesSection() {
  return (
    <section id="experiences" className="relative overflow-hidden bg-[var(--outly-night)] py-16 text-white sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="animate-drift-b pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-[var(--outly-violet)] opacity-20 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal visibleByDefault>
          <SectionHeading
            eyebrow="Featured"
            title="Experiences worth planning your weekend around"
            description="Examples of the hikes, viewpoints, trails, and meetups you can plan with OUTLY."
            tone="dark"
            className={COMPACT_HEADING}
          />
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCES.map((experience, index) => (
            <Reveal key={experience.title} visibleByDefault delay={index * 70} distance={16} duration={450} className="h-full">
              <ExperienceCard {...experience} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
