import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "Your profile — OUTLY",
  description: "View your OUTLY profile, interests, activity history, and saved places.",
};

const TABS = ["activity", "saved", "about"] as const;

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialTab = TABS.find((id) => id === tab);

  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ProfileView initialTab={initialTab} />
    </div>
  );
}
