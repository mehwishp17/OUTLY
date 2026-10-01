import type { EditProfileErrors, EditProfileValues } from "@/types/profile";

/** Username may contain only letters, numbers, and underscores. */
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const BIO_MAX_LENGTH = 220;

/**
 * Validates the edit-profile form. Mirrors the small typed-function
 * approach used in `lib/validation/auth-schemas.ts` (Phase 2) rather than
 * adding a schema-validation dependency for one more form.
 */
export function validateEditProfileForm(values: EditProfileValues): EditProfileErrors {
  const errors: EditProfileErrors = {};

  if (!values.name.trim()) {
    errors.name = "Full name is required.";
  } else if (values.name.trim().length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  if (!values.username.trim()) {
    errors.username = "Username is required.";
  } else if (!USERNAME_PATTERN.test(values.username.trim())) {
    errors.username = "Username can only contain letters, numbers, and underscores.";
  }

  if (values.bio.length > BIO_MAX_LENGTH) {
    errors.bio = `Bio must be ${BIO_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
}
