"use client";

import { useState } from "react";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { InterestSelectionStep } from "@/components/onboarding/interest-selection-step";
import { ActivityLevelStep } from "@/components/onboarding/activity-level-step";
import { LocationSelectionStep } from "@/components/onboarding/location-selection-step";
import { OnboardingComplete } from "@/components/onboarding/onboarding-complete";
import { Icon } from "@/components/ui/icon";
import type { OnboardingData, OnboardingStepId } from "@/types/onboarding";

const STEP_ORDER: OnboardingStepId[] = ["interests", "activity", "location", "complete"];

const STEP_LABELS: Record<OnboardingStepId, string> = {
  interests: "Interests",
  activity: "Activity level",
  location: "Location",
  complete: "Complete",
};

const INITIAL_DATA: OnboardingData = {
  interests: [],
  activityLevel: "",
  location: "",
};

/**
 * Multi-step onboarding flow. All state lives in this component only
 * (`useState`) — nothing is persisted to a backend, `localStorage`, or a
 * session. Going back and forth between steps never loses a selection
 * because `data` is only ever updated, never reset, while navigating.
 */
export function OnboardingFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  const step = STEP_ORDER[stepIndex];
  const isLastEditableStep = stepIndex === STEP_ORDER.length - 2;

  function toggleInterest(id: string) {
    setData((current) => ({
      ...current,
      interests: current.interests.includes(id)
        ? current.interests.filter((interestId) => interestId !== id)
        : [...current.interests, id],
    }));
  }

  function canContinue(): boolean {
    if (step === "interests") return data.interests.length > 0;
    if (step === "activity") return data.activityLevel !== "";
    if (step === "location") return data.location.trim().length >= 2;
    return true;
  }

  function handleContinue() {
    if (!canContinue()) return;
    setStepIndex((index) => Math.min(index + 1, STEP_ORDER.length - 1));
  }

  function handleBack() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  function requirementHint(): string | undefined {
    if (canContinue()) return undefined;
    if (step === "interests") return "Select at least one interest to continue.";
    if (step === "activity") return "Choose an activity level to continue.";
    if (step === "location") return "Enter a city or region to continue.";
    return undefined;
  }

  const hint = requirementHint();
  const continueDisabled = !canContinue();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:py-16">
      {step !== "complete" ? (
        <div className="mb-8">
          <OnboardingProgress
            currentStep={stepIndex + 1}
            totalSteps={STEP_ORDER.length - 1}
            stepLabel={STEP_LABELS[step]}
          />
        </div>
      ) : null}

      <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        {step === "interests" ? (
          <InterestSelectionStep selected={data.interests} onToggle={toggleInterest} error={hint} />
        ) : null}

        {step === "activity" ? (
          <ActivityLevelStep
            selected={data.activityLevel}
            onSelect={(level) => setData((current) => ({ ...current, activityLevel: level }))}
            error={hint}
          />
        ) : null}

        {step === "location" ? (
          <LocationSelectionStep
            location={data.location}
            onChange={(location) => setData((current) => ({ ...current, location }))}
            error={hint}
          />
        ) : null}

        {step === "complete" ? (
          <OnboardingComplete data={data} onEdit={() => setStepIndex(0)} />
        ) : null}

        {step !== "complete" ? (
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--outly-border)] pt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] disabled:pointer-events-none disabled:opacity-40"
            >
              <Icon name="chevron-left" className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={continueDisabled}
              aria-disabled={continueDisabled}
              aria-describedby={continueDisabled ? "continue-hint" : undefined}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white gradient-brand shadow-[var(--shadow-elevated)] transition-all hover:brightness-110 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50"
            >
              {isLastEditableStep ? "Review" : "Continue"}
            </button>
          </div>
        ) : null}
        {continueDisabled && step !== "complete" ? (
          <p id="continue-hint" className="sr-only">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
