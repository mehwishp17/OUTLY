import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { CreateEventView } from "@/components/events/create-event-view";

export const metadata: Metadata = {
  title: "Create an event — OUTLY",
  description: "Organize a group hike, cleanup, or meetup for the OUTLY community.",
};

export default function NewEventPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <CreateEventView />
    </div>
  );
}
