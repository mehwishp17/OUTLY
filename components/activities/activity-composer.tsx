"use client";

import { useEffect, useState } from "react";
import { ChipButton } from "@/components/ui/chip-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/ui/form-error";
import { fetchExplore } from "@/lib/api/places";
import { validateActivityForm } from "@/lib/validation/activity-schema";
import { ACTIVITY_PRIVACY_LABELS, ACTIVITY_TYPE_LABELS } from "@/types/activity";
import type {
  ActivityFormErrors,
  ActivityKind,
  ActivityPrivacy,
  ActivityStatus,
  CreateActivityInput,
} from "@/types/activity";
import { DIFFICULTY_LABELS, exploreKey } from "@/types/place";
import type { Difficulty, ExplorePlace } from "@/types/place";

const ACTIVITY_TYPE_OPTIONS = Object.keys(ACTIVITY_TYPE_LABELS) as ActivityKind[];
const PRIVACY_OPTIONS = Object.keys(ACTIVITY_PRIVACY_LABELS) as ActivityPrivacy[];
const DIFFICULTY_OPTIONS = Object.keys(DIFFICULTY_LABELS) as Difficulty[];

/** ISO -> the value `<input type="datetime-local">` expects (local time,
 * seconds/ms stripped, no timezone suffix). */
function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type ActivityComposerProps = {
  title: string;
  description?: string;
  initialValues?: Partial<CreateActivityInput>;
  submitLabel: string;
  /** May return a promise resolving to an error message; the form then stays
   * open and shows it instead of navigating away. */
  onSubmit: (values: CreateActivityInput) => void | Promise<string | undefined>;
  onCancel: () => void;
};

export function ActivityComposer({
  title,
  description,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ActivityComposerProps) {
  const [values, setValues] = useState<CreateActivityInput>({
    title: initialValues?.title ?? "",
    type: initialValues?.type ?? "hike",
    placeId: initialValues?.placeId,
    location: initialValues?.location ?? "",
    startAt: initialValues?.startAt ?? "",
    distanceKm: initialValues?.distanceKm,
    durationLabel: initialValues?.durationLabel ?? "",
    difficulty: initialValues?.difficulty,
    notes: initialValues?.notes ?? "",
    privacy: initialValues?.privacy ?? "public",
    status: initialValues?.status ?? "planned",
  });
  const [errors, setErrors] = useState<ActivityFormErrors>({});
  const [places, setPlaces] = useState<ExplorePlace[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  // The places and trails an activity can be linked to come from Explore.
  useEffect(() => {
    let cancelled = false;
    void fetchExplore().then((result) => {
      if (!cancelled && result.ok) setPlaces(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validationErrors = validateActivityForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSubmitting(true);
    setSubmitError(undefined);
    const error = await onSubmit(values);
    if (error) {
      setSubmitError(error);
      setSubmitting(false);
    }
  }

  function handlePlaceChange(placeId: string) {
    const place = places.find((candidate) => exploreKey(candidate) === placeId);
    setValues((current) => ({
      ...current,
      placeId: placeId || undefined,
      location: place ? place.location : current.location,
      difficulty: place ? place.difficulty : current.difficulty,
    }));
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-[var(--outly-ink)]">{title}</h1>
      {description ? <p className="mt-1 text-sm text-[var(--outly-muted)]">{description}</p> : null}

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Input
          id="activity-title"
          label="Title"
          required
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          error={errors.title}
          placeholder="e.g. Sunrise Ridge Trek"
        />

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">Type</span>
          <div role="group" aria-label="Activity type" className="flex flex-wrap gap-2">
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                active={values.type === option}
                onClick={() => setValues((current) => ({ ...current, type: option }))}
              >
                {ACTIVITY_TYPE_LABELS[option]}
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="activity-place" className="block text-sm font-semibold text-[var(--outly-ink)]">
            Link a place or trail (optional)
          </label>
          <select
            id="activity-place"
            value={values.placeId ?? ""}
            onChange={(event) => handlePlaceChange(event.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--outly-border)] bg-white px-4 py-2.5 text-sm text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors focus:border-[var(--outly-violet)] focus:outline-none"
          >
            <option value="">None</option>
            {places.map((place) => (
              <option key={exploreKey(place)} value={exploreKey(place)}>
                {place.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="activity-location"
          label="Location"
          required
          value={values.location}
          onChange={(event) => setValues((current) => ({ ...current, location: event.target.value }))}
          error={errors.location}
          placeholder="e.g. Kedarkantha, Uttarakhand"
        />

        <Input
          id="activity-start"
          label="Date & time"
          type="datetime-local"
          required
          value={toDatetimeLocalValue(values.startAt)}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              startAt: event.target.value ? new Date(event.target.value).toISOString() : "",
            }))
          }
          error={errors.startAt}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="activity-distance"
            label="Distance (km)"
            type="number"
            min={0}
            step="0.1"
            value={values.distanceKm ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                distanceKm: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
          <Input
            id="activity-duration"
            label="Duration"
            value={values.durationLabel ?? ""}
            onChange={(event) =>
              setValues((current) => ({ ...current, durationLabel: event.target.value }))
            }
            placeholder="e.g. 3 hours"
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">
            Difficulty (optional)
          </span>
          <div role="group" aria-label="Difficulty" className="flex flex-wrap gap-2">
            <ChipButton
              active={!values.difficulty}
              onClick={() => setValues((current) => ({ ...current, difficulty: undefined }))}
            >
              None
            </ChipButton>
            {DIFFICULTY_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                active={values.difficulty === option}
                onClick={() => setValues((current) => ({ ...current, difficulty: option }))}
              >
                {DIFFICULTY_LABELS[option]}
              </ChipButton>
            ))}
          </div>
        </div>

        <Textarea
          id="activity-notes"
          label="Notes (optional)"
          rows={3}
          value={values.notes ?? ""}
          onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Anything participants should know…"
        />

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">Visibility</span>
          <div role="group" aria-label="Visibility" className="flex flex-wrap gap-2">
            {PRIVACY_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                active={values.privacy === option}
                onClick={() => setValues((current) => ({ ...current, privacy: option }))}
              >
                {ACTIVITY_PRIVACY_LABELS[option]}
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">Status</span>
          <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
            {(["planned", "completed"] as ActivityStatus[]).map((option) => (
              <ChipButton
                key={option}
                active={values.status === option}
                onClick={() => setValues((current) => ({ ...current, status: option }))}
              >
                {option === "planned" ? "Planned" : "Completed"}
              </ChipButton>
            ))}
          </div>
        </div>

        {submitError ? <FormError id="activity-submit-error">{submitError}</FormError> : null}

        <div className="flex flex-col gap-3 border-t border-[var(--outly-border)] pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
