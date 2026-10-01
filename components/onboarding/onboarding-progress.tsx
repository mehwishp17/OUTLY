type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
};

/**
 * Step indicator: "Step X of Y" text plus a restrained progress bar.
 * Announced as a group so screen readers get the current position
 * without relying on the bar's visual width alone.
 */
export function OnboardingProgress({ currentStep, totalSteps, stepLabel }: OnboardingProgressProps) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div role="group" aria-label="Onboarding progress">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
        <span>
          Step {currentStep} of {totalSteps} — {stepLabel}
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--outly-border)]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full gradient-brand transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
