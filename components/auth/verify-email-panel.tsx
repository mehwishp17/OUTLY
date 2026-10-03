"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { resendVerification, verifyEmail } from "@/lib/api/auth";
import type { AuthStatus } from "@/types/auth";

type VerifyEmailPanelProps = {
  email: string;
  /** The token from the link in the verification email, when the person arrived through it. */
  token?: string;
};

/**
 * Email verification screen. Arriving through the link in the verification
 * email (`?token=...`) confirms the address with the backend; otherwise this
 * is the "check your inbox" screen with a working "Resend" action.
 */
export function VerifyEmailPanel({ email, token }: VerifyEmailPanelProps) {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [verified, setVerified] = useState<"checking" | "ok" | "failed" | null>(token ? "checking" : null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void verifyEmail(token).then((result) => {
      if (cancelled) return;
      setVerified(result.success ? "ok" : "failed");
      setMessage(result.success ? result.message : (result.fieldErrors.token ?? result.message));
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend() {
    setStatus("loading");
    const result = await resendVerification(email);
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
  }

  if (verified) {
    return (
      <AuthFormCard
        eyebrow="Explore · Connect · Belong"
        title={verified === "ok" ? "Email verified" : verified === "failed" ? "Link problem" : "Verifying…"}
      >
        {verified === "checking" ? (
          <p className="flex items-center gap-2 text-sm text-[var(--outly-muted)]">
            <LoadingSpinner /> Confirming your email address…
          </p>
        ) : (
          <AuthMessage variant={verified === "ok" ? "success" : "error"} title={verified === "ok" ? "You're verified" : "We couldn't verify your email"}>
            {message}
          </AuthMessage>
        )}
        <Button href={verified === "ok" ? "/feed" : "/login"} className="mt-6 w-full" size="lg">
          {verified === "ok" ? "Continue to OUTLY" : "Back to login"}
        </Button>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      eyebrow="Explore · Connect · Belong"
      title="Check your inbox"
      description="Open the verification link we emailed you to confirm your address."
    >
      <div className="space-y-5">
        <div className="rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Verification email sent to
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-[var(--outly-ink)]">{email}</p>
        </div>

        {status === "success" ? (
          <AuthMessage variant="success" title="Verification email resent">
            {message}
          </AuthMessage>
        ) : null}
        {status === "error" ? (
          <AuthMessage variant="error" title="Couldn't resend verification">
            {message}
          </AuthMessage>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={handleResend}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <LoadingSpinner /> Resending…
            </>
          ) : (
            "Resend verification email"
          )}
        </Button>

        <div className="flex flex-col items-center gap-2 pt-1 text-sm">
          <Link
            href="/signup"
            className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
          >
            Change email
          </Link>
          <Link
            href="/login"
            className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
          >
            Back to login
          </Link>
        </div>
      </div>
    </AuthFormCard>
  );
}
