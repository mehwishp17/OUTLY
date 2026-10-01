"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { AuthMessage } from "@/components/auth/auth-message";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSocialStore } from "@/context/social-store-context";
import { loginRequest } from "@/lib/api/auth";
import { validateLoginForm } from "@/lib/validation/auth-schemas";
import type { AuthStatus, LoginFormErrors, LoginFormValues } from "@/types/auth";

const INITIAL_VALUES: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

/**
 * Login form. Submits to `/api/auth/login` (a route handler that calls the
 * OUTLY backend and keeps the JWTs in httpOnly cookies), then continues to
 * the feed.
 */
export function LoginForm({ redirectTo = "/feed" }: { redirectTo?: string }) {
  const router = useRouter();
  const { resetSession } = useSocialStore();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    const result = await loginRequest(values);

    if (result.success) {
      setStatus("success");
      resetSession();
      router.push(redirectTo);
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  }

  return (
    <AuthFormCard title="Welcome back to OUTLY">
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {status === "error" ? (
          <AuthMessage variant="error" title="Couldn't log you in">
            {message}
          </AuthMessage>
        ) : null}

        <Input
          id="login-email"
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

        <PasswordField
          id="login-password"
          label="Password"
          required
          autoComplete="current-password"
          value={values.password}
          onChange={(value) => setValues((current) => ({ ...current, password: value }))}
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-4">
          <Checkbox
            id="login-remember"
            label="Remember me"
            checked={values.rememberMe}
            onChange={(event) =>
              setValues((current) => ({ ...current, rememberMe: event.target.checked }))
            }
          />
          <Link
            href="/forgot-password"
            className="shrink-0 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={status === "loading" || status === "success"}
        >
          {status === "loading" || status === "success" ? (
            <>
              <LoadingSpinner /> Logging in…
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <AuthLinks prompt="New to OUTLY?" linkLabel="Create an account" href="/signup" />
    </AuthFormCard>
  );
}
