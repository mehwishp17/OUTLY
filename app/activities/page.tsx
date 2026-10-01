import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ActivityListView } from "@/components/activities/activity-list-view";

export const metadata: Metadata = {
  title: "Activities — OUTLY",
  description: "Plan your next adventure or look back on completed activities.",
};

export default function ActivitiesPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ActivityListView />
    </div>
  );
}
