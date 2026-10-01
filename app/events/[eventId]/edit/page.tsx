import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <EditEventView eventId={eventId} />
    </div>
  );
}
