import type { EventFormErrors, EventFormValues } from "@/types/event";

/** Mirrors the small typed-function validation approach used across the
 * other domain schemas (`auth-schemas.ts`, `activity-schema.ts`, etc). */
export function validateEventForm(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Give this event a title.";
  }

  if (!values.location.trim()) {
    errors.location = "Add a location.";
  }

  if (!values.startAt) {
    errors.startAt = "Choose a start date and time.";
  }

  if (!values.capacity || values.capacity < 1) {
    errors.capacity = "Capacity must be at least 1.";
  }

  return errors;
}
