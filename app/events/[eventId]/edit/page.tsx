import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EditEventView } from "@/components/events/edit-event-view";

export const metadata: Metadata = {
  title: "Edit event — OUTLY",
  description: "Edit your OUTLY event.",
};

type EditEventPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { eventId } = await params;

  return (
    <FeedPageShell>
      <EditEventView eventId={eventId} />
    </FeedPageShell>
  );
}
