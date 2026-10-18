import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { EXPERIENCES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ExperiencesSection() {
  return (
    <section id="experiences" className="bg-[var(--outly-lavender)] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Featured"
            title="Experiences worth planning your weekend around"
            description="A snapshot of what's happening across OUTLY right now — hand-picked hikes, viewpoints, trails, and meetups."
          />
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:grid-rows-2">
          {EXPERIENCES.map((experience, index) => {
            const isLead = index === 0;
            return (
              <Reveal
                key={experience.title}
                delay={index * 70}
                distance={16}
                duration={450}
                className={cn("h-full", isLead && "sm:col-span-2 lg:row-span-2", index === 1 && "sm:col-span-2")}
              >
                <article
                  className={cn(
                    "group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] bg-[var(--outly-night)] shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none",
                    isLead ? "min-h-[24rem] lg:min-h-[34rem]" : "min-h-[18rem] lg:min-h-0",
                  )}
                  style={{ backgroundImage: experience.gradient }}
                >
                  <Image
                    src={experience.image}
                    alt={`${experience.title} — ${experience.location}`}
                    fill
                    sizes={isLead ? "(min-width: 1024px) 600px, 100vw" : "(min-width: 1024px) 290px, (min-width: 640px) 45vw, 100vw"}
                    style={{ objectPosition: experience.imagePosition }}
                    className="-z-10 object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--outly-night)]/90 via-[var(--outly-night)]/25 to-transparent"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {experience.category}
                  </span>
                  <div className="p-5 text-white sm:p-6">
                    <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-white/80">
                      <Icon name="pin" className="h-3.5 w-3.5" />
                      {experience.location}
                    </p>
                    <h3 className={cn("mt-2 font-semibold leading-snug", isLead ? "text-2xl sm:text-3xl" : "text-lg")}>
                      {experience.title}
                    </h3>
                    <p className={cn("mt-2 text-sm leading-relaxed text-white/80", !isLead && "line-clamp-3")}>
                      {experience.description}
                    </p>
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
