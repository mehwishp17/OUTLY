"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChipButton } from "@/components/ui/chip-button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchExplore } from "@/lib/api/places";
import { validateEventForm } from "@/lib/validation/event-schema";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_VISIBILITY_LABELS,
} from "@/types/event";
import type { EventCategory, EventFormErrors, EventFormValues, EventVisibility } from "@/types/event";
import { DIFFICULTY_LABELS, exploreKey } from "@/types/place";
import type { Difficulty, ExplorePlace } from "@/types/place";

const CATEGORY_OPTIONS = Object.keys(EVENT_CATEGORY_LABELS) as EventCategory[];
const VISIBILITY_OPTIONS = Object.keys(EVENT_VISIBILITY_LABELS) as EventVisibility[];
const DIFFICULTY_OPTIONS = Object.keys(DIFFICULTY_LABELS) as Difficulty[];

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type EventComposerProps = {
  title: string;
  description?: string;
  initialValues?: Partial<EventFormValues> & { startAt?: string };
  submitLabel: string;
  /** May return a promise resolving to an error message; the form then stays open and shows it. */
  onSubmit: (values: EventFormValues) => void | Promise<string | undefined>;
  onCancel: () => void;
};

export function EventComposer({
  title,
  description,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: EventComposerProps) {
  const [values, setValues] = useState<EventFormValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    category: initialValues?.category ?? "hike",
    placeId: initialValues?.placeId,
    location: initialValues?.location ?? "",
    meetingPoint: initialValues?.meetingPoint ?? "",
    startAt: initialValues?.startAt ?? "",
    capacity: initialValues?.capacity ?? 10,
    difficulty: initialValues?.difficulty,
    requiresApproval: initialValues?.requiresApproval ?? false,
    visibility: initialValues?.visibility ?? "public",
  });
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [places, setPlaces] = useState<ExplorePlace[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  // The places and trails an event can be linked to come from Explore.
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
    const validationErrors = validateEventForm(values);
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
          id="event-title"
          label="Title"
          required
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          error={errors.title}
          placeholder="e.g. Saturday Morning Group Hike"
        />

        <Textarea
          id="event-description"
          label="Description"
          rows={3}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="What should participants expect?"
        />

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">Category</span>
          <div role="group" aria-label="Event category" className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                active={values.category === option}
                onClick={() => setValues((current) => ({ ...current, category: option }))}
              >
                {EVENT_CATEGORY_LABELS[option]}
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="event-place" className="block text-sm font-semibold text-[var(--outly-ink)]">
            Link a place or trail (optional)
          </label>
          <select
            id="event-place"
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
          id="event-location"
          label="Location"
          required
          value={values.location}
          onChange={(event) => setValues((current) => ({ ...current, location: event.target.value }))}
          error={errors.location}
          placeholder="e.g. Sinhagad, Pune"
        />

        <Input
          id="event-meeting-point"
          label="Meeting point (optional)"
          value={values.meetingPoint ?? ""}
          onChange={(event) =>
            setValues((current) => ({ ...current, meetingPoint: event.target.value }))
          }
          placeholder="e.g. Base parking lot"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="event-start"
            label="Start date & time"
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
          <Input
            id="event-capacity"
            label="Capacity"
            type="number"
            min={1}
            required
            value={values.capacity}
            onChange={(event) =>
              setValues((current) => ({ ...current, capacity: Number(event.target.value) || 0 }))
            }
            error={errors.capacity}
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

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">
            Joining requires organizer approval?
          </span>
          <div role="group" aria-label="Approval requirement" className="flex flex-wrap gap-2">
            <ChipButton
              active={!values.requiresApproval}
              onClick={() => setValues((current) => ({ ...current, requiresApproval: false }))}
            >
              No — anyone can join
            </ChipButton>
            <ChipButton
              active={values.requiresApproval}
              onClick={() => setValues((current) => ({ ...current, requiresApproval: true }))}
            >
              Yes — I&apos;ll approve requests
            </ChipButton>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">Visibility</span>
          <div role="group" aria-label="Visibility" className="flex flex-wrap gap-2">
            {VISIBILITY_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                active={values.visibility === option}
                onClick={() => setValues((current) => ({ ...current, visibility: option }))}
              >
                {EVENT_VISIBILITY_LABELS[option]}
              </ChipButton>
            ))}
          </div>
        </div>

        {submitError ? <FormError id="event-submit-error">{submitError}</FormError> : null}

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
