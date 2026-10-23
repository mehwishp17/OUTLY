import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { ExploreView } from "@/components/explore/explore-view";

export const metadata: Metadata = {
  title: "Explore — OUTLY",
  description: "Discover trails, viewpoints, campsites, and routes worth the trip.",
};

export default function ExplorePage() {
  return (
    <FeedPageShell>
      <ExploreView />
    </FeedPageShell>
  );
}
