import type { ActivityFormErrors, CreateActivityInput } from "@/types/activity";

/**
 * Validates the create/edit activity form. Mirrors the small
 * typed-function approach used across the other domain schemas
 * (`auth-schemas.ts`, `profile-schema.ts`, `post-schema.ts`).
 */
export function validateActivityForm(values: CreateActivityInput): ActivityFormErrors {
  const errors: ActivityFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Give this activity a title.";
  }

  if (!values.location.trim()) {
    errors.location = "Add a location.";
  }

  if (!values.startAt) {
    errors.startAt = "Choose a date and time.";
  }

  return errors;
}
