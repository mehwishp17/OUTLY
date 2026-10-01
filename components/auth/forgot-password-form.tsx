"use client";

import { useState } from "react";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { mockPasswordReset } from "@/lib/mock/mock-auth";
import { validateForgotPasswordForm } from "@/lib/validation/auth-schemas";
import type { AuthStatus, ForgotPasswordErrors, ForgotPasswordValues } from "@/types/auth";

const INITIAL_VALUES: ForgotPasswordValues = { email: "" };

/**
 * Password recovery form. Always resolves to a generic success message
 * (mocked, via `mockPasswordReset`) regardless of whether the email
 * "exists" — there is no account data to check, and this also matches
 * the security-conscious pattern a real implementation should follow
 * (never reveal whether an email is registered).
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
    const result = await mockPasswordReset(values);
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
  }

  if (status === "success") {
    return (
      <AuthFormCard eyebrow="Explore · Connect · Belong" title="Reset your password">
        <AuthMessage variant="success" title="Check your inbox (mocked)">
          {message}
        </AuthMessage>
        <Button href="/reset-password" className="mt-6 w-full" size="lg">
          Continue to reset password (preview)
        </Button>
        <AuthLinks prompt="Remembered it after all?" linkLabel="Back to login" href="/login" />
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      eyebrow="Explore · Connect · Belong"
      title="Reset your password"
      description="Enter your email and we'll show you what happens next."
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
