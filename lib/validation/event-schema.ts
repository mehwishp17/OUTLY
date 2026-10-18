import type { EventFormErrors, EventFormValues } from "@/types/event";

/** Mirror the backend's image rules (`apps/common/uploads.py`, default 5 MB). */
export const COVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const COVER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Returns an error message for a file that can't be a cover image, or undefined when it is fine. */
export function validateCoverImage(file: File): string | undefined {
  if (!COVER_IMAGE_TYPES.includes(file.type)) return "Choose a JPEG, PNG, or WebP image.";
  if (file.size > COVER_IMAGE_MAX_BYTES) return "That image is too large. The limit is 5 MB.";
  return undefined;
}

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
