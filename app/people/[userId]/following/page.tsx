import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { FollowingView } from "@/components/social-graph/following-view";

export const metadata: Metadata = {
  title: "Following — OUTLY",
  description: "See who this OUTLY member follows.",
};

type FollowingPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { userId } = await params;

  return (
    <FeedPageShell>
      <FollowingView userId={userId} />
    </FeedPageShell>
  );
}
