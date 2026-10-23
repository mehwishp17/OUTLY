import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { ActivityListView } from "@/components/activities/activity-list-view";

export const metadata: Metadata = {
  title: "Activities — OUTLY",
  description: "Plan your next adventure or look back on completed activities.",
};

export default function ActivitiesPage() {
  return (
    <FeedPageShell>
      <ActivityListView />
    </FeedPageShell>
  );
}
