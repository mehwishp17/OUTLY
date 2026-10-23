import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { ExplorePlaceDetailView } from "@/components/explore/explore-place-detail-view";

export const metadata: Metadata = {
  title: "Trail — OUTLY",
  description: "View route details, difficulty, and safety notes for this trail.",
};

type TrailDetailPageProps = {
  params: Promise<{ trailId: string }>;
};

export default async function TrailDetailPage({ params }: TrailDetailPageProps) {
  const { trailId } = await params;

  return (
    <FeedPageShell>
      <ExplorePlaceDetailView key={trailId} placeId={trailId} expectedKind="trail" />
    </FeedPageShell>
  );
}
