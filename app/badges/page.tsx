import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { BadgesView } from "@/components/gamification/badges-view";

export const metadata: Metadata = {
  title: "Badges — OUTLY",
  description: "Badges awarded for completed activities, distance, and consistency.",
};

export default function BadgesPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <BadgesView />
    </div>
  );
}
