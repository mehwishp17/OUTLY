import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExperienceCard } from "@/components/ui/experience-card";
import { EXPERIENCES } from "@/lib/constants";

export function ExperiencesSection() {
  return (
    <section id="experiences" className="bg-[var(--outly-lavender)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
        <SectionHeading
          eyebrow="Featured"
          title="Experiences worth planning your weekend around"
          description="A snapshot of what's happening across OUTLY right now — hand-picked hikes, viewpoints, trails, and meetups."
        />
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCES.map((experience, index) => (
            <Reveal key={experience.title} delay={index * 70} distance={16} duration={450} className="h-full">
              <ExperienceCard {...experience} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
