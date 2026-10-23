import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
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
    <FeedPageShell>
      <FollowersView userId={userId} />
    </FeedPageShell>
  );
}
