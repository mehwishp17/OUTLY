import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EditProfileForm } from "@/components/profile/edit-profile-form";

export const metadata: Metadata = {
  title: "Edit profile — OUTLY",
  description: "Update your OUTLY profile details, interests, and skill level.",
};

export default function EditProfilePage() {
  return (
    <FeedPageShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="text-2xl font-bold text-[var(--outly-ink)]">Edit profile</h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Changes are saved to your account.
        </p>
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <EditProfileForm />
        </div>
      </div>
    </FeedPageShell>
  );
}
