"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { AuthMessage } from "@/components/auth/auth-message";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSocialStore } from "@/context/social-store-context";
import { registerRequest } from "@/lib/api/auth";
import { validateSignupForm } from "@/lib/validation/auth-schemas";
import type { AuthStatus, SignupFormErrors, SignupFormValues } from "@/types/auth";

const INITIAL_VALUES: SignupFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  // Consent is given by submitting the form; the notice under the button states it.
  acceptTerms: true,
};

/**
 * Sign-up form. Submits to `/api/auth/register` (a route handler that calls
 * the OUTLY backend), then continues to onboarding.
 */
export function SignupForm() {
  const router = useRouter();
  const { resetSession } = useSocialStore();
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [hasStartedPassword, setHasStartedPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateSignupForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    const result = await registerRequest(values);

    if (result.success) {
      setStatus("success");
      resetSession();
      router.push("/onboarding");
    } else {
      setStatus("error");
      setMessage(result.message);
      setErrors(result.fieldErrors as SignupFormErrors);
    }
  }

  return (
    <AuthFormCard title="Create account">
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {status === "error" ? (
          <AuthMessage variant="error" title="We couldn't create your account">
            {message}
          </AuthMessage>
        ) : null}

        <Input
          id="signup-name"
          label="Full name"
          autoComplete="name"
          required
          value={values.fullName}
          onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
          error={errors.fullName}
          placeholder="Ariana Fox"
          className="py-3 shadow-none"
        />

        <Input
          id="signup-email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          error={errors.email}
          placeholder="you@example.com"
          className="py-3 shadow-none"
        />

        <div>
          <PasswordField
            id="signup-password"
            label="Password"
            required
            autoComplete="new-password"
            value={values.password}
            onChange={(value) => setValues((current) => ({ ...current, password: value }))}
            onFocus={() => setHasStartedPassword(true)}
            error={errors.password}
          />
          {hasStartedPassword ? <PasswordStrength password={values.password} /> : null}
        </div>

        <PasswordField
          id="signup-confirm-password"
          label="Confirm password"
          required
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(value) => setValues((current) => ({ ...current, confirmPassword: value }))}
          error={errors.confirmPassword}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={status === "loading" || status === "success"}
        >
          {status === "loading" || status === "success" ? (
            <>
              <LoadingSpinner /> Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
        <p className="text-center text-xs text-[var(--outly-muted)]">
          By creating an account you agree to OUTLY&apos;s Terms of Service and Privacy Policy.
        </p>
      </form>

      <AuthLinks prompt="Already have an account?" linkLabel="Log in" href="/login" />
    </AuthFormCard>
  );
}
