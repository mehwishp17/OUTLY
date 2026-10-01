import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata: Metadata = {
  title: "Verify your email — OUTLY",
  description: "Frontend-only email verification preview for your OUTLY account.",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const email = params.email?.trim() || "your@email.com";

  return (
    <AuthShell>
      <VerifyEmailPanel email={email} />
    </AuthShell>
  );
}
