import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { ExplorePlaceDetailView } from "@/components/explore/explore-place-detail-view";

export const metadata: Metadata = {
  title: "Place — OUTLY",
  description: "View details, facilities, and safety notes for this place.",
};

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = await params;

  return (
    <FeedPageShell>
      <ExplorePlaceDetailView key={placeId} placeId={placeId} expectedKind="place" />
    </FeedPageShell>
  );
}
