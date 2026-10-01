import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <EventParticipantsView eventId={eventId} />
    </div>
  );
}
