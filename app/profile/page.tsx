import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "Your profile — OUTLY",
  description: "View your OUTLY profile, interests, activity history, and saved places.",
};

export default function ProfilePage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ProfileView />
    </div>
  );
}
