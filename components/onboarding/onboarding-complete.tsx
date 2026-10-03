"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSocialStore } from "@/context/social-store-context";
import { ONBOARDING_ACTIVITY_LEVELS, ONBOARDING_INTERESTS } from "@/lib/constants";
import type { OnboardingData } from "@/types/onboarding";

type OnboardingCompleteProps = {
  data: OnboardingData;
  onEdit: () => void;
};

/**
 * Final onboarding step — a summary of the selections. "Start exploring"
 * saves them to the profile (they also personalise Explore and the feed) and
 * continues into the signed-in app's Home Feed.
 */
export function OnboardingComplete({ data, onEdit }: OnboardingCompleteProps) {
  const router = useRouter();
  const { saveOnboarding } = useSocialStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function handleStart() {
    setSaving(true);
    setError(undefined);
    const failure = await saveOnboarding(data);
    if (failure) {
      setError(failure);
      setSaving(false);
      return;
    }
    router.push("/feed");
  }

  const interestLabels = ONBOARDING_INTERESTS.filter((interest) =>
    data.interests.includes(interest.id),
  ).map((interest) => interest.label);

  const activityLabel = ONBOARDING_ACTIVITY_LEVELS.find(
    (level) => level.id === data.activityLevel,
  )?.label;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
        You&apos;re ready to explore.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">
        Your OUTLY experience starts with places worth discovering and people worth meeting.
      </p>

      <dl className="mt-6 space-y-4 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] p-5">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Interests
          </dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {interestLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--outly-border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--outly-ink)]"
              >
                {label}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Activity level
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--outly-ink)]">{activityLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Location
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--outly-ink)]">{data.location}</dd>
        </div>
      </dl>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-[#B3164C]">
          {error}
        </p>
      ) : null}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="w-full sm:w-auto" onClick={handleStart} disabled={saving}>
          {saving ? (
            <>
              <LoadingSpinner /> Saving…
            </>
          ) : (
            "Start exploring"
          )}
        </Button>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)] sm:self-center"
        >
          Edit preferences
        </button>
      </div>
    </div>
  );
}
