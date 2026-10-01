"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { ONBOARDING_LOCATION_SUGGESTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LocationSelectionStepProps = {
  location: string;
  onChange: (location: string) => void;
  error?: string;
};

/**
 * Onboarding step 3 — city/region input with example suggestion chips.
 * "Use my current location" is presentational only per the project
 * requirements: it never calls the browser geolocation API, and instead
 * explains that automatic detection isn't enabled in this preview.
 */
export function LocationSelectionStep({ location, onChange, error }: LocationSelectionStepProps) {
  const [showLocationNote, setShowLocationNote] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
        Where do you usually explore?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">
        Tell us a city or region so we can surface nearby trails and communities first.
      </p>

      <div className="mt-6 space-y-4">
        <Input
          id="onboarding-location"
          label="City or region"
          required
          value={location}
          onChange={(event) => onChange(event.target.value)}
          error={error}
          placeholder="e.g. Bengaluru"
        />

        <button
          type="button"
          onClick={() => setShowLocationNote(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="pin" className="h-4 w-4" />
          Use my current location
        </button>
        {showLocationNote ? (
          <p role="status" className="text-xs text-[var(--outly-muted)]">
            Location detection isn&apos;t enabled in this preview — please enter your city or
            region above instead.
          </p>
        ) : null}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Popular regions
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ONBOARDING_LOCATION_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onChange(suggestion)}
                aria-pressed={location === suggestion}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors motion-reduce:transition-none",
                  location === suggestion
                    ? "border-[var(--outly-violet)] bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]"
                    : "border-[var(--outly-border)] text-[var(--outly-muted)] hover:border-[var(--outly-violet)]/50",
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
