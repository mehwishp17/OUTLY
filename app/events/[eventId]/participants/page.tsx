import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EventParticipantsView } from "@/components/events/event-participants-view";

export const metadata: Metadata = {
  title: "Participants — OUTLY",
  description: "See who's going, pending, and declined for this event.",
};

type EventParticipantsPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventParticipantsPage({ params }: EventParticipantsPageProps) {
  const { eventId } = await params;

  return (
    <FeedPageShell>
      <EventParticipantsView eventId={eventId} />
    </FeedPageShell>
  );
}
