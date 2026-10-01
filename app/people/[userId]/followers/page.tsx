import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { FollowersView } from "@/components/social-graph/followers-view";

export const metadata: Metadata = {
  title: "Followers — OUTLY",
  description: "See who's following this OUTLY member.",
};

type FollowersPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { userId } = await params;

  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <FollowersView userId={userId} />
    </div>
  );
}
