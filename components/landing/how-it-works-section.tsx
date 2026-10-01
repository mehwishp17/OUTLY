import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Three steps to your next adventure" />
        </Reveal>

        <ol className="mt-14 grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <li key={step.number} className="relative flex flex-col items-center text-center">
              <Reveal delay={index * 120} className="flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white gradient-brand">
                {step.number}
              </span>
              {index < HOW_IT_WORKS_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-8 hidden h-px w-full -translate-x-0 bg-gradient-to-r from-[var(--outly-violet)]/30 to-transparent sm:block"
                  style={{ left: "calc(50% + 2rem)", width: "calc(100% - 4rem)" }}
                />
              ) : null}
              <h3 className="mt-5 text-lg font-semibold text-[var(--outly-ink)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">
                {step.description}
              </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
