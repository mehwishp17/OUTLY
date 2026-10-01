import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ExplorePlaceDetailView placeId={trailId} expectedKind="trail" />
    </div>
  );
}
