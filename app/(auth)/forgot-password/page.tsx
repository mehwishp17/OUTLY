import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { AUTH_IMAGES } from "@/lib/adventure-images";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — OUTLY",
  description: "Request a password reset for your OUTLY account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      formSurface="plain"
      brandPanel={<AuthVisualPanel image={AUTH_IMAGES.pondHikers} position="50% 55%" sideImages={[AUTH_IMAGES.lakeTent, AUTH_IMAGES.ridgeHikers]} />}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
