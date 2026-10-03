import type { Metadata } from "next";
import { OutlyLogo } from "@/components/brand/outly-logo";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Onboarding — OUTLY",
  description: "Tell us what you love outdoors so OUTLY can tailor trails and communities to you.",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <header className="border-b border-[var(--outly-border)] bg-white/70 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center px-4 sm:px-6">
          <OutlyLogo width={44} height={44} priority variant="transparent" quality={100} />
        </div>
      </header>
      <OnboardingFlow />
    </div>
  );
}
