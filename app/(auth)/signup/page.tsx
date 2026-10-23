import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { AUTH_IMAGES } from "@/lib/adventure-images";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your OUTLY account and start finding the places and people worth exploring.",
};

export default function SignupPage() {
  return (
    <AuthShell formSurface="plain" brandPanel={(
        <AuthVisualPanel
          image={AUTH_IMAGES.goldenTrail}
          position="50% 60%"
          sideImages={[AUTH_IMAGES.ridgeHikers, AUTH_IMAGES.pondHikers]}
        />
      )}>
      <SignupForm />
    </AuthShell>
  );
}
