import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ExplorePlaceDetailView placeId={placeId} expectedKind="place" />
    </div>
  );
}
