"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { mockResendVerification } from "@/lib/mock/mock-auth";
import type { AuthStatus } from "@/types/auth";

type VerifyEmailPanelProps = {
  email: string;
};

/**
 * Frontend-only email verification screen. There is no real email being
 * sent — "Resend verification" simulates a request via
 * `mockResendVerification` and simply reports success/failure locally.
 */
export function VerifyEmailPanel({ email }: VerifyEmailPanelProps) {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleResend() {
    setStatus("loading");
    const result = await mockResendVerification(email);
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
  }

  return (
    <AuthFormCard
      eyebrow="Explore · Connect · Belong"
      title="Check your inbox"
      description="We've prepared a verification step for your OUTLY account."
    >
      <div className="space-y-5">
        <div className="rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Verification email sent to
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-[var(--outly-ink)]">{email}</p>
        </div>

        {status === "success" ? (
          <AuthMessage variant="success" title="Verification email resent (mocked)">
            {message}
          </AuthMessage>
        ) : null}
        {status === "error" ? (
          <AuthMessage variant="error" title="Couldn't resend verification">
            {message}
          </AuthMessage>
        ) : null}

        <p className="text-sm leading-relaxed text-[var(--outly-muted)]">
          This is a frontend-only preview — no verification email has actually been sent, and no
          account has actually been verified.
        </p>

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
