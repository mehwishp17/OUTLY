"use client";

import { ONBOARDING_INTERESTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProfileInterestsProps = {
  selected: string[];
  /** When provided, renders as an interactive multi-select (used inside
   * `edit-profile-form.tsx`) instead of a read-only badge list. */
  onToggle?: (id: string) => void;
};

/**
 * Displays the user's outdoor interests as badges on the profile page, or
 * — when `onToggle` is supplied — as an accessible interactive
 * multi-select reusing the same `ONBOARDING_INTERESTS` list shown during
 * onboarding, so interest labels stay consistent everywhere in the app.
 */
export function ProfileInterests({ selected, onToggle }: ProfileInterestsProps) {
  if (!onToggle) {
    if (selected.length === 0) {
      return <p className="text-sm text-[var(--outly-muted)]">No interests added yet.</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {ONBOARDING_INTERESTS.filter((interest) => selected.includes(interest.id)).map((interest) => (
          <Badge key={interest.id} variant="muted">
            {interest.label}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div role="group" aria-label="Outdoor interests" className="flex flex-wrap gap-2">
      {ONBOARDING_INTERESTS.map((interest) => {
        const isSelected = selected.includes(interest.id);
        return (
          <button
            key={interest.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(interest.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors motion-reduce:transition-none",
              isSelected
                ? "border-transparent gradient-brand text-white"
                : "border-[var(--outly-border)] bg-white text-[var(--outly-ink)] hover:border-[var(--outly-violet)]/60",
            )}
          >
            {interest.label}
          </button>
        );
      })}
    </div>
  );
}
