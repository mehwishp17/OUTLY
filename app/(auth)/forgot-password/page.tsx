import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { ADVENTURE_IMAGES } from "@/lib/adventure-images";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — OUTLY",
  description: "Request a password reset for your OUTLY account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      formSurface="plain"
      brandPanel={<AuthVisualPanel image={ADVENTURE_IMAGES.loginHero} position="30% center" sideImages={[ADVENTURE_IMAGES.exploreTrail, ADVENTURE_IMAGES.activitiesCycling]} />}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
