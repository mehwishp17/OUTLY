import type { Metadata } from "next";
import { OutlyLogo } from "@/components/brand/outly-logo";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Onboarding — OUTLY",
  description: "Tell us what you love outdoors so OUTLY can tailor trails and communities to you.",
};

export default function OnboardingPage() {
  return (
    // The opt-in dark theme (`.app-dark`) and glow from FeedPageShell, but with this page's own logo-only header:
    // the shell adds the full navbar, which onboarding deliberately leaves out.
    <div className="app-dark relative min-h-svh overflow-x-clip bg-[var(--outly-night)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem]"
        style={{
          backgroundImage:
            "radial-gradient(60% 70% at 18% 0%, rgba(124,58,237,0.24), transparent), radial-gradient(45% 55% at 86% 8%, rgba(236,72,153,0.14), transparent)",
        }}
      />
      <div className="relative">
        <header className="border-b border-[var(--outly-border)] bg-white/70 py-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center px-4 sm:px-6">
            <OutlyLogo width={44} height={44} priority variant="transparent" quality={100} />
          </div>
        </header>
        <OnboardingFlow />
      </div>
    </div>
  );
}
