import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata: Metadata = {
  title: "Verify your email — OUTLY",
  description: "Confirm the email address of your OUTLY account.",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const email = params.email?.trim() || "your@email.com";

  return (
    <AuthShell>
      <VerifyEmailPanel email={email} token={params.token?.trim() || undefined} />
    </AuthShell>
  );
}
