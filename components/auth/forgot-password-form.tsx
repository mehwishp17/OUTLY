"use client";

import { useState } from "react";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { requestPasswordReset } from "@/lib/api/auth";
import { validateForgotPasswordForm } from "@/lib/validation/auth-schemas";
import type { AuthStatus, ForgotPasswordErrors, ForgotPasswordValues } from "@/types/auth";

const INITIAL_VALUES: ForgotPasswordValues = { email: "" };

/**
 * Password recovery form. The backend emails a reset link and always answers
 * with the same generic message, whether or not the email is registered —
 * it never reveals which emails have accounts.
 */
export function ForgotPasswordForm() {
  const [values, setValues] = useState<ForgotPasswordValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateForgotPasswordForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setStatus("loading");
    const result = await requestPasswordReset(values.email);
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
  }

  if (status === "success") {
    return (
      <AuthFormCard icon="check-circle" title="Check your email">
        <AuthMessage variant="success" title="Check your inbox">
          {message}
        </AuthMessage>
        <AuthLinks prompt="Remembered it after all?" linkLabel="Back to login" href="/login" />
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      icon="lock"
      title="Forgot your password?"
      description="No problem. Enter the email you signed up with and we'll send you a link to choose a new one."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {status === "error" ? (
          <AuthMessage variant="error" title="Something went wrong">
            {message}
          </AuthMessage>
        ) : null}

        <Input
          id="forgot-email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(event) => setValues({ email: event.target.value })}
          error={errors.email}
          placeholder="you@example.com"
          className="py-3 shadow-none"
        />

        <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? (
            <>
              <LoadingSpinner /> Sending reset link…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <AuthLinks prompt="Remembered your password?" linkLabel="Back to login" href="/login" />
    </AuthFormCard>
  );
}
