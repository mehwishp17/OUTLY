import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ExploreView } from "@/components/explore/explore-view";

export const metadata: Metadata = {
  title: "Explore — OUTLY",
  description: "Discover trails, viewpoints, campsites, and routes worth the trip.",
};

export default function ExplorePage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ExploreView />
    </div>
  );
}
