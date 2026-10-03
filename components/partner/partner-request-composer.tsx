"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChipButton } from "@/components/ui/chip-button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validatePartnerRequestForm } from "@/lib/validation/partner-schema";
import { ACTIVITY_TYPE_LABELS } from "@/types/activity";
import type { ActivityKind } from "@/types/activity";
import type { SkillLevel } from "@/types/profile";
import { SKILL_LEVEL_LABELS } from "@/types/partner";
import type { PartnerRequestFormErrors, PartnerRequestFormValues } from "@/types/partner";

const ACTIVITY_OPTIONS = Object.keys(ACTIVITY_TYPE_LABELS) as ActivityKind[];
const SKILL_OPTIONS = Object.keys(SKILL_LEVEL_LABELS) as SkillLevel[];

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type PartnerRequestComposerProps = {
  title: string;
  description?: string;
  initialValues?: Partial<PartnerRequestFormValues>;
  submitLabel: string;
  /** May return a promise resolving to an error message; the form then stays open and shows it. */
  onSubmit: (values: PartnerRequestFormValues) => void | Promise<string | undefined>;
  onCancel: () => void;
};

export function PartnerRequestComposer({
  title,
  description,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: PartnerRequestComposerProps) {
  const [values, setValues] = useState<PartnerRequestFormValues>({
    activity: initialValues?.activity ?? "hike",
    destination: initialValues?.destination ?? "",
    preferredAt: initialValues?.preferredAt ?? "",
    experienceLevel: initialValues?.experienceLevel ?? "beginner",
    spots: initialValues?.spots ?? 1,
    description: initialValues?.description ?? "",
  });
  const [errors, setErrors] = useState<PartnerRequestFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validationErrors = validatePartnerRequestForm(values);
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

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-[var(--outly-ink)]">{title}</h1>
      {description ? <p className="mt-1 text-sm text-[var(--outly-muted)]">{description}</p> : null}

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">Activity</span>
          <div role="group" aria-label="Activity" className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                active={values.activity === option}
                onClick={() => setValues((current) => ({ ...current, activity: option }))}
              >
                {ACTIVITY_TYPE_LABELS[option]}
              </ChipButton>
            ))}
          </div>
        </div>

        <Input
          id="partner-destination"
          label="Destination"
          required
          value={values.destination}
          onChange={(event) =>
            setValues((current) => ({ ...current, destination: event.target.value }))
          }
          error={errors.destination}
          placeholder="e.g. Kedarkantha, Uttarakhand"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="partner-preferred-at"
            label="Preferred date & time"
            type="datetime-local"
            required
            value={toDatetimeLocalValue(values.preferredAt)}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                preferredAt: event.target.value ? new Date(event.target.value).toISOString() : "",
              }))
            }
            error={errors.preferredAt}
          />
          <Input
            id="partner-spots"
            label="Number of spots"
            type="number"
            min={1}
            required
            value={values.spots}
            onChange={(event) =>
              setValues((current) => ({ ...current, spots: Number(event.target.value) || 0 }))
            }
            error={errors.spots}
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">
            Preferred experience level
          </span>
          <div role="group" aria-label="Experience level" className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                active={values.experienceLevel === option}
                onClick={() => setValues((current) => ({ ...current, experienceLevel: option }))}
              >
                {SKILL_LEVEL_LABELS[option]}
              </ChipButton>
            ))}
          </div>
        </div>

        <Textarea
          id="partner-description"
          label="Description"
          required
          rows={3}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
          error={errors.description}
          placeholder="What are you planning, and who are you looking for?"
        />

        {submitError ? <FormError id="partner-submit-error">{submitError}</FormError> : null}

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
