import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon, type IconName } from "@/components/ui/icon";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";

const STEP_ICONS: IconName[] = ["compass", "users", "heart"];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Three steps to your next adventure" />
        </Reveal>

        <ol className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-3 lg:gap-12">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <li key={step.number} className="h-full">
              <Reveal delay={index * 120} className="h-full">
                <div className="relative flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--outly-border)] p-6 shadow-[var(--shadow-soft)]" style={{ backgroundImage: "var(--gradient-brand-soft)" }}>
                  <div className="flex items-center gap-4">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-[var(--shadow-soft)] gradient-brand"
                      aria-hidden="true"
                    >
                      <Icon name={STEP_ICONS[index]} className="h-6 w-6" />
                    </span>
                    {index < HOW_IT_WORKS_STEPS.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="relative z-10 -mr-[calc(1.5rem+3rem)] hidden flex-1 border-t-2 border-dashed border-[var(--outly-violet)]/40 lg:block"
                      />
                    ) : null}
                  </div>
                  <p className="mt-5 text-sm font-semibold tracking-wide text-[var(--outly-violet)]">
                    {step.number}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[var(--outly-ink)]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
