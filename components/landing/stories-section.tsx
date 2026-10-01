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
    <section id="stories" className="bg-[var(--outly-lavender)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading eyebrow="Stories" title="What explorers are saying" />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {STORIES.map((story, index) => {
            const isFeatured = index === 1;
            return (
              <Reveal key={story.name} delay={index * 80} className="h-full">
              <figure
                className={cn(
                  "flex h-full flex-col justify-between rounded-[var(--radius-lg)] p-7 shadow-[var(--shadow-soft)]",
                  isFeatured
                    ? "gradient-night text-white lg:-translate-y-4"
                    : "border border-[var(--outly-border)] bg-white text-[var(--outly-ink)]",
                )}
              >
                <Icon
                  name="quote"
                  className={cn("h-8 w-8", isFeatured ? "text-[var(--outly-pink-bright)]" : "text-[var(--outly-violet)]/30")}
                />
                <blockquote className="mt-4 flex-1 text-base leading-relaxed">
                  {story.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold",
                      isFeatured ? "bg-white/15 text-white" : "gradient-brand text-white",
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
                    <p className={cn("text-xs", isFeatured ? "text-white/60" : "text-[var(--outly-muted)]")}>
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
