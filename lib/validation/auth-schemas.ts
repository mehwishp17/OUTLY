import type {
  ForgotPasswordErrors,
  ForgotPasswordValues,
  LoginFormErrors,
  LoginFormValues,
  ResetPasswordErrors,
  ResetPasswordValues,
  SignupFormErrors,
  SignupFormValues,
} from "@/types/auth";

/**
 * Small, dependency-free validation helpers for the auth forms. Zod is
 * not installed in this project and these forms are simple enough that a
 * few typed functions keep things readable without adding a new
 * dependency (per the "avoid unnecessary libraries" project rule).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LOGIN_PASSWORD_MIN_LENGTH = 8;

export type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

/**
 * Full signup password rules. Reused by both validation (must all pass)
 * and `PasswordStrength` (live checklist as the user types).
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "One special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return "Email address is required.";
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return "Enter a valid email address, like you@example.com.";
  }
  return undefined;
}

export function validateFullName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Full name is required.";
  }
  if (trimmed.length < 2) {
    return "Full name must be at least 2 characters.";
  }
  if (trimmed.length > 80) {
    return "Full name must be under 80 characters.";
  }
  return undefined;
}

/** Basic password check used on the login form (existing accounts). */
export function validateLoginPassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < LOGIN_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${LOGIN_PASSWORD_MIN_LENGTH} characters.`;
  }
  return undefined;
}

/** Full complexity check used on the sign-up form (new accounts). */
export function validateSignupPassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }
  const unmet = PASSWORD_REQUIREMENTS.filter((requirement) => !requirement.test(password));
  if (unmet.length > 0) {
    return `Password must include: ${unmet.map((requirement) => requirement.label.toLowerCase()).join(", ")}.`;
  }
  return undefined;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) {
    return "Please confirm your password.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return undefined;
}

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  const passwordError = validateLoginPassword(values.password);
  if (passwordError) errors.password = passwordError;
  return errors;
}

export function validateSignupForm(values: SignupFormValues): SignupFormErrors {
  const errors: SignupFormErrors = {};
  const nameError = validateFullName(values.fullName);
  if (nameError) errors.fullName = nameError;
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  const passwordError = validateSignupPassword(values.password);
  if (passwordError) errors.password = passwordError;
  const confirmError = validateConfirmPassword(values.password, values.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;
  if (!values.acceptTerms) {
    errors.acceptTerms = "You must accept the Terms and Privacy Policy to continue.";
  }
  return errors;
}

export function validateForgotPasswordForm(values: ForgotPasswordValues): ForgotPasswordErrors {
  const errors: ForgotPasswordErrors = {};
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  return errors;
}

export function validateResetPasswordForm(values: ResetPasswordValues): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {};
  const passwordError = validateSignupPassword(values.password);
  if (passwordError) errors.password = passwordError;
  const confirmError = validateConfirmPassword(values.password, values.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;
  return errors;
}
