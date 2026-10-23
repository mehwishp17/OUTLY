import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
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
    <FeedPageShell>
      <ProfileView initialTab={initialTab} />
    </FeedPageShell>
  );
}
