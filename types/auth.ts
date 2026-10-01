/**
 * Shared types for the frontend-only OUTLY authentication UI (Phase 2).
 * These describe form shapes and mock results only — there is no real
 * backend, session, or persisted user yet.
 */

export type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export type SignupFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>;

export type ForgotPasswordValues = {
  email: string;
};

export type ForgotPasswordErrors = Partial<Record<keyof ForgotPasswordValues, string>>;

export type ResetPasswordValues = {
  password: string;
  confirmPassword: string;
};

export type ResetPasswordErrors = Partial<Record<keyof ResetPasswordValues, string>>;

/**
 * Result shape returned by every function in `lib/mock/mock-auth.ts`.
 * `field` optionally identifies which form field a failure relates to,
 * so the calling form can attach the message to the right input.
 */
export type MockAuthResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
      field?: string;
    };

/**
 * Generic async form status used by every auth form. "idle" is the
 * resting state before submission; "loading" simulates a pending mock
 * request; "success" / "error" reflect the mock result.
 */
export type AuthStatus = "idle" | "loading" | "success" | "error";
