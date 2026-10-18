import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { STORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The middle story is rendered as a "featured" dark card so the three
 * testimonials read as a considered layout rather than three identical
 * repeated tiles.
 */
export function StoriesSection() {
  return (
    <section id="stories" className="bg-[var(--outly-lavender)] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading eyebrow="Stories" title="What explorers are saying" />
        </Reveal>

        <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-3 lg:items-stretch lg:gap-6">
          {STORIES.map((story, index) => {
            const isFeatured = index === 1;
            return (
              <Reveal key={story.name} delay={index * 80} className="h-full">
              <figure
                className={cn(
                  "flex h-full flex-col justify-between rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none",
                  isFeatured
                    ? "gradient-brand text-white shadow-[var(--shadow-elevated)] lg:-translate-y-4 lg:py-10"
                    : "border border-[var(--outly-border)] bg-white text-[var(--outly-ink)]",
                )}
              >
                <Icon
                  name="quote"
                  className={cn("h-10 w-10", isFeatured ? "text-white/80" : "text-[var(--outly-violet)]/30")}
                />
                <blockquote className={cn("mt-5 flex-1 leading-relaxed", isFeatured ? "text-xl font-medium" : "text-lg")}>
                  {story.quote}
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3 border-t border-current/10 pt-6">
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ring-2",
                      isFeatured ? "bg-white/15 text-white ring-white/40" : "gradient-brand text-white ring-[var(--outly-border)]",
                    )}
                    aria-hidden="true"
                  >
                    {story.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{story.name}</p>
                    <p className={cn("text-xs", isFeatured ? "text-white/75" : "text-[var(--outly-muted)]")}>
                      {story.role}
                    </p>
                  </div>
                </figcaption>
              </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
