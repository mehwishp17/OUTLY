import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ExploreMapView } from "@/components/explore/explore-map-view";

export const metadata: Metadata = {
  title: "Explore map — OUTLY",
  description: "See where OUTLY's trails and places sit relative to each other.",
};

export default function ExploreMapPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ExploreMapView />
    </div>
  );
}
