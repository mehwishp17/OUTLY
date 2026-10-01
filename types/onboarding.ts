/**
 * Shared types for the local-state-only onboarding flow (Phase 2). No
 * data here is persisted to a backend — it lives only in React state for
 * the duration of the flow.
 */

export type ActivityLevel = "beginner" | "intermediate" | "advanced" | "";

export type OnboardingData = {
  interests: string[];
  activityLevel: ActivityLevel;
  location: string;
};

export type OnboardingStepId = "interests" | "activity" | "location" | "complete";

export type OnboardingStepErrors = Partial<Record<Exclude<OnboardingStepId, "complete">, string>>;
