import type { Metadata } from "next";
import { LogoutButton } from "@/components/auth/logout-button";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { PrivacySettingsForm } from "@/components/profile/privacy-settings-form";

export const metadata: Metadata = {
  title: "Privacy settings — OUTLY",
  description: "Control who can see your OUTLY profile, activity history, and saved places.",
};

export default function ProfileSettingsPage() {
  return (
    <FeedPageShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">Privacy settings</h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Choose who can see your profile, activity history, and saved places.
        </p>
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <PrivacySettingsForm />
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:px-8">
          <p className="text-sm font-semibold text-[var(--outly-ink)]">Account</p>
          <LogoutButton />
        </div>
      </div>
    </FeedPageShell>
  );
}
