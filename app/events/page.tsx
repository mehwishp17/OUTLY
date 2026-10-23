import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EventListView } from "@/components/events/event-list-view";

export const metadata: Metadata = {
  title: "Events — OUTLY",
  description: "Group hikes, cleanups, and meetups happening with the OUTLY community.",
};

export default function EventsPage() {
  return (
    <FeedPageShell>
      <EventListView />
    </FeedPageShell>
  );
}
