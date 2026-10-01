"use client";

import { useState } from "react";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { AuthMessage } from "@/components/auth/auth-message";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { mockResetPassword } from "@/lib/mock/mock-auth";
import { validateResetPasswordForm } from "@/lib/validation/auth-schemas";
import type { AuthStatus, ResetPasswordErrors, ResetPasswordValues } from "@/types/auth";

const INITIAL_VALUES: ResetPasswordValues = { password: "", confirmPassword: "" };

/**
 * Password reset form reached via the (mocked) link from
 * `ForgotPasswordForm`. Submission is entirely mocked (`mockResetPassword`)
 * — no real account, token, or session exists to validate against.
 */
export function ResetPasswordForm() {
  const [values, setValues] = useState<ResetPasswordValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateResetPasswordForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setStatus("loading");
    const result = await mockResetPassword(values);
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
  }

  if (status === "success") {
    return (
      <AuthFormCard eyebrow="Explore · Connect · Belong" title="Password updated">
        <AuthMessage variant="success" title="You're all set (mocked)">
          {message}
        </AuthMessage>
        <Button href="/login" className="mt-6 w-full" size="lg">
          Continue to login
        </Button>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      eyebrow="Explore · Connect · Belong"
      title="Set a new password"
      description="Choose a new password for your OUTLY account."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {status === "error" ? (
          <AuthMessage variant="error" title="Something went wrong">
            {message}
          </AuthMessage>
        ) : null}

        <div>
          <PasswordField
            id="reset-password"
            label="New password"
            required
            autoComplete="new-password"
            value={values.password}
            onChange={(value) => setValues((current) => ({ ...current, password: value }))}
            error={errors.password}
          />
          <PasswordStrength password={values.password} />
        </div>

        <PasswordField
          id="reset-confirm-password"
          label="Confirm new password"
          required
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(value) => setValues((current) => ({ ...current, confirmPassword: value }))}
          error={errors.confirmPassword}
        />

        <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? (
            <>
              <LoadingSpinner /> Updating password…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>

      <AuthLinks prompt="Remembered your password?" linkLabel="Back to login" href="/login" />
    </AuthFormCard>
  );
}
