import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";

// Compact heading sizes for the landing page (the shared SectionHeading keeps its defaults).
const COMPACT_HEADING = "[&_h2]:text-2xl sm:[&_h2]:text-3xl lg:[&_h2]:text-4xl";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[var(--outly-ink)] py-16 text-white sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal visibleByDefault>
          <SectionHeading
            eyebrow="How it works"
            title="Three steps to your next adventure"
            tone="dark"
            className={COMPACT_HEADING}
          />
        </Reveal>

        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <li key={step.number} className="relative flex flex-col items-center text-center">
              <Reveal visibleByDefault delay={index * 120} className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_10px_30px_rgba(124,58,237,0.45)] gradient-brand">
                  {step.number}
                </span>
                {index < HOW_IT_WORKS_STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-7 hidden h-px w-full -translate-x-0 bg-gradient-to-r from-white/25 to-transparent sm:block"
                    style={{ left: "calc(50% + 2.25rem)", width: "calc(100% - 4.5rem)" }}
                  />
                ) : null}
                <h3 className="mt-4 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-white/65">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
