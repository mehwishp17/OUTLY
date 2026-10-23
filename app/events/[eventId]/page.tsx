import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EventDetailView } from "@/components/events/event-detail-view";

export const metadata: Metadata = {
  title: "Event — OUTLY",
  description: "View event details and join the adventure.",
};

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;

  return (
    <FeedPageShell>
      <EventDetailView eventId={eventId} />
    </FeedPageShell>
  );
}
