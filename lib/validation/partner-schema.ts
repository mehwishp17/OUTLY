import type { PartnerRequestFormErrors, PartnerRequestFormValues } from "@/types/partner";

/** Mirrors the small typed-function validation approach used across the
 * other domain schemas. */
export function validatePartnerRequestForm(
  values: PartnerRequestFormValues,
): PartnerRequestFormErrors {
  const errors: PartnerRequestFormErrors = {};

  if (!values.destination.trim()) {
    errors.destination = "Add a destination.";
  }

  if (!values.preferredAt) {
    errors.preferredAt = "Choose a preferred date and time.";
  }

  if (!values.spots || values.spots < 1) {
    errors.spots = "Number of spots must be at least 1.";
  }

  if (!values.description.trim()) {
    errors.description = "Add a short description for potential partners.";
  }

  return errors;
}
