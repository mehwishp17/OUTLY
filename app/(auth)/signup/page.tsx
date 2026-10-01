import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { ADVENTURE_IMAGES } from "@/lib/adventure-images";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your OUTLY account and start finding the places and people worth exploring.",
};

export default function SignupPage() {
  return (
    <AuthShell formSurface="plain" brandPanel={(
        <AuthVisualPanel
          image={ADVENTURE_IMAGES.signupHero}
          sideImages={[ADVENTURE_IMAGES.eventsCamping, ADVENTURE_IMAGES.exploreTrail]}
        />
      )}>
      <SignupForm />
    </AuthShell>
  );
}
