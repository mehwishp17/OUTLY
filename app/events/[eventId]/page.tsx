import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <EventDetailView eventId={eventId} />
    </div>
  );
}
