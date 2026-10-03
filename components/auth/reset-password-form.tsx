"use client";

import { useState } from "react";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { AuthMessage } from "@/components/auth/auth-message";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { confirmPasswordReset } from "@/lib/api/auth";
import { validateResetPasswordForm } from "@/lib/validation/auth-schemas";
import type { AuthStatus, ResetPasswordErrors, ResetPasswordValues } from "@/types/auth";

const INITIAL_VALUES: ResetPasswordValues = { password: "", confirmPassword: "" };

/**
 * Password reset form reached from the link in the reset email
 * (`/reset-password?uid=...&token=...`). The backend checks the token, sets
 * the new password and signs out every other session of the account.
 */
export function ResetPasswordForm({ uid, token }: { uid: string; token: string }) {
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

    if (!uid || !token) {
      setStatus("error");
      setMessage("This reset link is incomplete. Open the link from your email again, or request a new one.");
      return;
    }

    setStatus("loading");
    const result = await confirmPasswordReset({ uid, token, password: values.password, confirmPassword: values.confirmPassword });
    if (result.success) {
      setStatus("success");
      setMessage(result.message);
      return;
    }
    setStatus("error");
    setErrors((current) => ({
      ...current,
      password: result.fieldErrors.password ?? current.password,
      confirmPassword: result.fieldErrors.confirmPassword ?? current.confirmPassword,
    }));
    setMessage(result.fieldErrors.token ?? result.message);
  }

  if (status === "success") {
    return (
      <AuthFormCard icon="check-circle" title="Password updated">
        <AuthMessage variant="success" title="You're all set">
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
      icon="lock"
      title="Set a new password"
      description="Choose a strong password you haven't used before. You'll use it to log in from now on."
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
