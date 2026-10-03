import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { ADVENTURE_IMAGES } from "@/lib/adventure-images";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password — OUTLY",
  description: "Set a new password for your OUTLY account.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ uid?: string; token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  return (
    <AuthShell
      formSurface="plain"
      brandPanel={<AuthVisualPanel image={ADVENTURE_IMAGES.exploreTrail} position="30% center" sideImages={[ADVENTURE_IMAGES.loginHero, ADVENTURE_IMAGES.activitiesCycling]} />}
    >
      <ResetPasswordForm uid={params.uid?.trim() ?? ""} token={params.token?.trim() ?? ""} />
    </AuthShell>
  );
}
