import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { ExploreMapView } from "@/components/explore/explore-map-view";

export const metadata: Metadata = {
  title: "Explore map — OUTLY",
  description: "See where OUTLY's trails and places sit relative to each other.",
};

export default function ExploreMapPage() {
  return (
    <FeedPageShell>
      <ExploreMapView />
    </FeedPageShell>
  );
}
