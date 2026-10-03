"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChipButton } from "@/components/ui/chip-button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateGroupForm } from "@/lib/validation/group-schema";
import type { GroupFormErrors, GroupFormValues, GroupVisibility } from "@/types/group";

const VISIBILITY_OPTIONS: { value: GroupVisibility; label: string }[] = [
  { value: "public", label: "Public — anyone can find and join" },
  { value: "private", label: "Private — members only" },
];

type GroupComposerProps = {
  title: string;
  description?: string;
  initialValues?: Partial<GroupFormValues>;
  submitLabel: string;
  /** May return a promise resolving to an error message; the form then stays open and shows it. */
  onSubmit: (values: GroupFormValues) => void | Promise<string | undefined>;
  onCancel: () => void;
};

export function GroupComposer({
  title,
  description,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: GroupComposerProps) {
  const [values, setValues] = useState<GroupFormValues>({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    category: initialValues?.category ?? "",
    visibility: initialValues?.visibility ?? "public",
    rules: initialValues?.rules ?? "",
  });
  const [errors, setErrors] = useState<GroupFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validationErrors = validateGroupForm(values);
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
        <Input
          id="group-name"
          label="Group name"
          required
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          error={errors.name}
          placeholder="e.g. Bengaluru Trail Runners"
        />

        <Input
          id="group-category"
          label="Category"
          required
          value={values.category}
          onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
          error={errors.category}
          placeholder="e.g. Trail running, Camping, Cycling"
        />

        <Textarea
          id="group-description"
          label="Description"
          required
          rows={3}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
          error={errors.description}
          placeholder="What is this group about?"
        />

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-[var(--outly-ink)]">Visibility</span>
          <div role="group" aria-label="Visibility" className="flex flex-wrap gap-2">
            {VISIBILITY_OPTIONS.map((option) => (
              <ChipButton
                key={option.value}
                active={values.visibility === option.value}
                onClick={() => setValues((current) => ({ ...current, visibility: option.value }))}
              >
                {option.label}
              </ChipButton>
            ))}
          </div>
        </div>

        <Textarea
          id="group-rules"
          label="Group rules (optional)"
          rows={3}
          value={values.rules ?? ""}
          onChange={(event) => setValues((current) => ({ ...current, rules: event.target.value }))}
          placeholder="e.g. Be respectful, no littering on trails…"
        />

        {submitError ? <FormError id="group-submit-error">{submitError}</FormError> : null}

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
