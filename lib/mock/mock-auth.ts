import type {
  ForgotPasswordValues,
  LoginFormValues,
  MockAuthResult,
  ResetPasswordValues,
  SignupFormValues,
} from "@/types/auth";

/**
 * ---------------------------------------------------------------------
 * MOCK AUTHENTICATION SERVICE — FRONTEND ONLY, NO REAL BACKEND
 * ---------------------------------------------------------------------
 * Everything in this file simulates network latency and returns a typed
 * result so the UI can exercise loading/success/error states. Nothing
 * here talks to a server, database, or session store.
 *
 * This MUST be replaced with real calls to the Node.js backend
 * (authentication provider + database) in a future phase. Until then:
 *   - No password is ever persisted, hashed, or sent anywhere.
 *   - No password is ever logged (console.log/console.error/etc.).
 *   - No real session/token is created.
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sentinel email addresses that deliberately trigger the mock failure
 * branch, so the error UI can be previewed and tested without a real
 * backend. Documented in docs/authentication.md.
 */
const MOCK_FAILURE_EMAIL = "fail@outly.test";

export async function mockLogin(values: LoginFormValues): Promise<MockAuthResult> {
  await delay(900);

  if (values.email.trim().toLowerCase() === MOCK_FAILURE_EMAIL) {
    return {
      success: false,
      message:
        "We couldn't log you in with those details (simulated failure for preview purposes).",
      field: "password",
    };
  }

  return {
    success: true,
    message: "You're logged in (mocked) — no real account was accessed.",
  };
}

export async function mockSignup(values: SignupFormValues): Promise<MockAuthResult> {
  await delay(1100);

  if (values.email.trim().toLowerCase() === MOCK_FAILURE_EMAIL) {
    return {
      success: false,
      message:
        "This email is already in use in this simulated preview. Try a different email.",
      field: "email",
    };
  }

  return {
    success: true,
    message: "Your OUTLY account preview was created (mocked) — nothing was saved to a server.",
  };
}

export async function mockPasswordReset(values: ForgotPasswordValues): Promise<MockAuthResult> {
  await delay(800);
  void values.email;

  // Always succeeds regardless of whether the email is "registered" —
  // there is no real account data to check, and a real implementation
  // should avoid revealing account existence either way.
  return {
    success: true,
    message: "If this email is registered with OUTLY, reset instructions would be sent here.",
  };
}

export async function mockResetPassword(values: ResetPasswordValues): Promise<MockAuthResult> {
  await delay(900);
  void values.password;

  // Always succeeds in this preview — there is no real reset token or
  // account to validate against.
  return {
    success: true,
    message: "Your password would be updated here (mocked) — no account was actually changed.",
  };
}

export async function mockResendVerification(email: string): Promise<MockAuthResult> {
  await delay(700);

  if (email.trim().toLowerCase() === MOCK_FAILURE_EMAIL) {
    return {
      success: false,
      message: "We couldn't resend a verification email in this simulated preview. Try again.",
    };
  }

  return {
    success: true,
    message: "A verification email would be resent here (mocked) — no email was actually sent.",
  };
}
