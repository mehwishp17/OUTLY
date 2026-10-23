import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { PublicProfileView } from "@/components/social-graph/public-profile-view";

export const metadata: Metadata = {
  title: "Profile — OUTLY",
  description: "View this OUTLY member's public profile.",
};

type PublicProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { userId } = await params;

  return (
    <FeedPageShell>
      <PublicProfileView key={userId} userId={userId} />
    </FeedPageShell>
  );
}
