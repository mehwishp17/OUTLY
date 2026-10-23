import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { CreateActivityView } from "@/components/activities/create-activity-view";

export const metadata: Metadata = {
  title: "Create an activity — OUTLY",
  description: "Plan a hike, ride, or camping trip and invite people to join.",
};

export default function NewActivityPage() {
  return (
    <FeedPageShell>
      <CreateActivityView />
    </FeedPageShell>
  );
}
