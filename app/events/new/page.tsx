import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { CreateEventView } from "@/components/events/create-event-view";

export const metadata: Metadata = {
  title: "Create an event — OUTLY",
  description: "Organize a group hike, cleanup, or meetup for the OUTLY community.",
};

export default function NewEventPage() {
  return (
    <FeedPageShell>
      <CreateEventView />
    </FeedPageShell>
  );
}
