import type { PostComposerErrors } from "@/types/post";

export const POST_CONTENT_MAX_LENGTH = 500;
export const COMMENT_CONTENT_MAX_LENGTH = 300;

/**
 * Validates the create/edit post composer. Mirrors the small typed-function
 * approach used in `lib/validation/auth-schemas.ts` and
 * `lib/validation/profile-schema.ts` rather than adding a schema-validation
 * dependency for one more form.
 */
export function validatePostComposer(content: string): PostComposerErrors {
  const errors: PostComposerErrors = {};
  const trimmed = content.trim();

  if (!trimmed) {
    errors.content = "Write something before posting.";
  } else if (trimmed.length > POST_CONTENT_MAX_LENGTH) {
    errors.content = `Posts must be ${POST_CONTENT_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
}

export function validateCommentContent(content: string): string | undefined {
  const trimmed = content.trim();
  if (!trimmed) {
    return "Write a comment before posting.";
  }
  if (trimmed.length > COMMENT_CONTENT_MAX_LENGTH) {
    return `Comments must be ${COMMENT_CONTENT_MAX_LENGTH} characters or fewer.`;
  }
  return undefined;
}
