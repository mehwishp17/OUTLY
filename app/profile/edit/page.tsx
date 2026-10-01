import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { EditProfileForm } from "@/components/profile/edit-profile-form";

export const metadata: Metadata = {
  title: "Edit profile — OUTLY",
  description: "Update your OUTLY profile details, interests, and skill level.",
};

export default function EditProfilePage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="text-2xl font-bold text-[var(--outly-ink)]">Edit profile</h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Changes are saved to this session only and reset on reload.
        </p>
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <EditProfileForm />
        </div>
      </div>
    </div>
  );
}
