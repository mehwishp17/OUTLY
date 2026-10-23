"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChipButton } from "@/components/ui/chip-button";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/ui/form-error";
import { LocationField } from "@/components/explore/location-field";
import { PlacePicker } from "@/components/explore/place-picker";
import { validateActivityForm } from "@/lib/validation/activity-schema";
import { COVER_IMAGE_TYPES, validateCoverImage } from "@/lib/validation/event-schema";
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

/** Small uppercase heading that groups the form's fields (visual only: the fields keep their order). */
const SECTION_HEADING = "text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--outly-muted)]";

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
  initialValues?: Partial<CreateActivityInput> & { coverUrl?: string };
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  // Cover image: the saved one (if any), a newly chosen file with a local preview, or removal.
  const [existingCoverUrl, setExistingCoverUrl] = useState(initialValues?.coverUrl);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>();
  const [coverError, setCoverError] = useState<string>();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverInputId = useId();
  const shownCover = coverPreview ?? existingCoverUrl;

  // Free the local preview when it is replaced or the form closes.
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function handleCoverSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = validateCoverImage(file);
    if (problem) {
      setCoverError(problem);
      return;
    }
    setCoverError(undefined);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleRemoveCover() {
    setCoverError(undefined);
    setCoverFile(null);
    setCoverPreview(undefined);
    setExistingCoverUrl(undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validationErrors = validateActivityForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSubmitting(true);
    setSubmitError(undefined);
    const error = await onSubmit({
      ...values,
      coverFile,
      // Only meaningful when there was a saved cover and the creator removed it without a replacement.
      removeCover: !coverFile && !existingCoverUrl && Boolean(initialValues?.coverUrl),
    });
    if (error) {
      setSubmitError(error);
      setSubmitting(false);
    }
  }

  function handlePlaceSelect(place: ExplorePlace | undefined) {
    setValues((current) => ({
      ...current,
      placeId: place ? exploreKey(place) : undefined,
      location: place ? place.location : current.location,
      difficulty: place ? place.difficulty : current.difficulty,
    }));
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] p-6 shadow-[var(--shadow-elevated)] sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
      {description ? <p className="mt-1 text-sm text-[var(--outly-muted)]">{description}</p> : null}

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-5">
        <h2 className={SECTION_HEADING}>The basics</h2>

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

        <h2 className={`${SECTION_HEADING} border-t border-white/10 pt-5`}>Where and when</h2>

        <PlacePicker
          id="activity-place"
          label="Link a place or trail (optional)"
          value={values.placeId}
          onChange={handlePlaceSelect}
        />

        <LocationField
          id="activity-location"
          label="Location"
          required
          value={values.location}
          onChange={(location) => setValues((current) => ({ ...current, location }))}
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

        <h2 className={`${SECTION_HEADING} border-t border-white/10 pt-5`}>Details</h2>

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

        <div className="space-y-2">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">Cover image (optional)</span>
          {shownCover ? (
            // The whole photo is shown (never cropped); the dark backdrop fills any space around it.
            <div className="flex max-h-72 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob preview or backend-served cover. */}
              <img src={shownCover} alt="Selected activity cover preview" className="max-h-72 w-auto max-w-full object-contain" />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={submitting}
              className={
                shownCover
                  ? "inline-flex items-center gap-2 rounded-full border border-[var(--outly-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--outly-violet)]/60 disabled:pointer-events-none disabled:opacity-50"
                  : "flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-white/25 bg-white/[0.03] px-4 py-5 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:border-[var(--outly-pink)]/60 hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
              }
            >
              <Icon name="image" className={shownCover ? "h-4 w-4" : "h-5 w-5 text-[var(--outly-pink)]"} />
              {shownCover ? "Change image" : "Add cover image"}
            </button>
            {shownCover ? (
              <button
                type="button"
                onClick={handleRemoveCover}
                disabled={submitting}
                className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-muted)] transition-colors hover:text-[#b3164c] disabled:pointer-events-none disabled:opacity-50"
              >
                Remove image
              </button>
            ) : null}
          </div>
          <input
            ref={coverInputRef}
            id={coverInputId}
            type="file"
            accept={COVER_IMAGE_TYPES.join(",")}
            onChange={handleCoverSelected}
            className="sr-only"
            aria-label="Choose a cover image"
          />
          <p className="text-xs text-[var(--outly-muted)]">JPEG, PNG or WebP, up to 5 MB. Shown on the activity card and page.</p>
          {coverError ? <FormError id="activity-cover-error">{coverError}</FormError> : null}
        </div>

        <h2 className={`${SECTION_HEADING} border-t border-white/10 pt-5`}>Sharing</h2>

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
