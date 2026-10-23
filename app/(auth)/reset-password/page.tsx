import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { AUTH_IMAGES } from "@/lib/adventure-images";
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
      brandPanel={<AuthVisualPanel image={AUTH_IMAGES.ridgeHikers} position="50% 60%" sideImages={[AUTH_IMAGES.pondHikers, AUTH_IMAGES.lakeTent]} />}
    >
      <ResetPasswordForm uid={params.uid?.trim() ?? ""} token={params.token?.trim() ?? ""} />
    </AuthShell>
  );
}
