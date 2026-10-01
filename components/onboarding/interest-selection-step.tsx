import { SelectionCard } from "@/components/onboarding/selection-card";
import { ONBOARDING_INTERESTS } from "@/lib/constants";

type InterestSelectionStepProps = {
  selected: string[];
  onToggle: (id: string) => void;
  error?: string;
};

/**
 * Onboarding step 1 — multi-select interests grid. Requires at least one
 * selection (enforced by the parent flow disabling "Continue").
 */
export function InterestSelectionStep({ selected, onToggle, error }: InterestSelectionStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
        What do you love doing outdoors?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">
        Choose as many as you like — this shapes the trails and events you&apos;ll see first.
      </p>

      <div
        role="group"
        aria-label="Outdoor interests"
        aria-describedby={error ? "interests-error" : undefined}
        className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {ONBOARDING_INTERESTS.map((interest) => (
          <SelectionCard
            key={interest.id}
            title={interest.label}
            selected={selected.includes(interest.id)}
            onSelect={() => onToggle(interest.id)}
          />
        ))}
      </div>

      {error ? (
        <p id="interests-error" role="alert" className="mt-3 text-sm font-medium text-[#B3164C]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
