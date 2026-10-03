"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingState } from "@/components/ui/loading-state";
import { useSocialStore } from "@/context/social-store-context";
import { cn } from "@/lib/utils";
import type { PrivacySettings, ProfileVisibility } from "@/types/profile";

const VISIBILITY_OPTIONS: Array<{ id: ProfileVisibility; label: string; description: string }> = [
  {
    id: "public",
    label: "Public",
    description: "Anyone on OUTLY can view your profile, bio, and interests.",
  },
  {
    id: "communityOnly",
    label: "Community only",
    description: "Only people who follow you can view your full profile.",
  },
  {
    id: "private",
    label: "Private",
    description: "Only you can view your full profile details.",
  },
];

/**
 * Privacy settings form. Saving stores the settings on your account; the
 * backend then enforces them (who can see your profile, followers list and
 * activity history), and /profile respects them straight away.
 */
function PrivacySettingsFields() {
  const { currentUser, updatePrivacySettings } = useSocialStore();
  const [settings, setSettings] = useState<PrivacySettings>(currentUser.privacy);
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [saveError, setSaveError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setSaveError(undefined);
    const error = await updatePrivacySettings(settings);
    if (error) {
      setSaveError(error);
      setStatus("idle");
      return;
    }
    setStatus("success");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {status === "success" ? (
        <Alert variant="success" title="Privacy settings updated">
          Your changes were saved to your account.
        </Alert>
      ) : null}
      {saveError ? <Alert variant="error" title="Couldn't save your settings">{saveError}</Alert> : null}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-[var(--outly-ink)]">
          Profile visibility
        </legend>
        <div role="radiogroup" aria-label="Profile visibility" className="flex flex-col gap-2.5">
          {VISIBILITY_OPTIONS.map((option) => {
            const isSelected = settings.profileVisibility === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-4 transition-colors",
                  isSelected
                    ? "border-[var(--outly-violet)] bg-[var(--outly-lavender)]"
                    : "border-[var(--outly-border)] bg-white hover:border-[var(--outly-violet)]/50",
                )}
              >
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSettings((current) => ({ ...current, profileVisibility: option.id }))}
                  className="mt-1 h-4 w-4 accent-[var(--outly-violet)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--outly-ink)]">{option.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[var(--outly-muted)]">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--outly-border)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--outly-ink)]">Show activity history on profile</p>
          <p className="mt-0.5 text-xs text-[var(--outly-muted)]">
            Controls whether your completed activities appear on your public profile page.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.showActivityHistory}
          aria-label="Show activity history on profile"
          onClick={() =>
            setSettings((current) => ({ ...current, showActivityHistory: !current.showActivityHistory }))
          }
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors motion-reduce:transition-none",
            settings.showActivityHistory ? "gradient-brand" : "bg-[var(--outly-border)]",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
              settings.showActivityHistory ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--outly-border)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--outly-ink)]">Show saved places on profile</p>
          <p className="mt-0.5 text-xs text-[var(--outly-muted)]">
            Controls whether your saved places/experiences appear on your public profile page.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.showSavedPlaces}
          aria-label="Show saved places on profile"
          onClick={() =>
            setSettings((current) => ({ ...current, showSavedPlaces: !current.showSavedPlaces }))
          }
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors motion-reduce:transition-none",
            settings.showSavedPlaces ? "gradient-brand" : "bg-[var(--outly-border)]",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
              settings.showSavedPlaces ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="flex justify-end border-t border-[var(--outly-border)] pt-6">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? (
            <>
              <LoadingSpinner /> Saving…
            </>
          ) : (
            "Save settings"
          )}
        </Button>
      </div>
    </form>
  );
}

/** Waits for the signed-in profile to load so the form starts from the saved settings. */
export function PrivacySettingsForm() {
  const { currentUserStatus } = useSocialStore();
  if (currentUserStatus === "error") {
    return <Alert variant="error" title="We couldn't load your profile. Please refresh and try again." />;
  }
  if (currentUserStatus !== "ready") return <LoadingState message="Loading your settings…" />;
  return <PrivacySettingsFields />;
}
