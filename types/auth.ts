/**
 * Shared types for the OUTLY authentication UI: form shapes and statuses.
 * Sign-up, login, password reset and email verification are performed by
 * the backend through `lib/api/auth.ts`.
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
 * Generic async form status used by every auth form. "idle" is the
 * resting state before submission; "loading" is a request in flight;
 * "success" / "error" reflect the backend's answer.
 */
export type AuthStatus = "idle" | "loading" | "success" | "error";
