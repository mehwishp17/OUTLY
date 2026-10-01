import { SelectionCard } from "@/components/onboarding/selection-card";
import { ONBOARDING_ACTIVITY_LEVELS } from "@/lib/constants";
import type { ActivityLevel } from "@/types/onboarding";

type ActivityLevelStepProps = {
  selected: ActivityLevel;
  onSelect: (level: ActivityLevel) => void;
  error?: string;
};

/**
 * Onboarding step 2 — single-select activity level. Requires exactly one
 * selection before continuing.
 */
export function ActivityLevelStep({ selected, onSelect, error }: ActivityLevelStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
        What pace feels right for you?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">
        We&apos;ll match trail difficulty and group pace to this — you can change it any time.
      </p>

      <div
        role="group"
        aria-label="Activity level"
        aria-describedby={error ? "activity-error" : undefined}
        className="mt-6 flex flex-col gap-3"
      >
        {ONBOARDING_ACTIVITY_LEVELS.map((level) => (
          <SelectionCard
            key={level.id}
            title={level.label}
            description={level.description}
            selected={selected === level.id}
            onSelect={() => onSelect(level.id)}
          />
        ))}
      </div>

      {error ? (
        <p id="activity-error" role="alert" className="mt-3 text-sm font-medium text-[#B3164C]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
