import type { GroupFormErrors, GroupFormValues } from "@/types/group";

/** Mirrors the small typed-function validation approach used across the
 * other domain schemas (`auth-schemas.ts`, `activity-schema.ts`, etc). */
export function validateGroupForm(values: GroupFormValues): GroupFormErrors {
  const errors: GroupFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Give this group a name.";
  }

  if (!values.category.trim()) {
    errors.category = "Add a category, like \"Trail running\" or \"Camping\".";
  }

  if (!values.description.trim()) {
    errors.description = "Add a short description so people know what this group is about.";
  }

  return errors;
}
