import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { EventListView } from "@/components/events/event-list-view";

export const metadata: Metadata = {
  title: "Events — OUTLY",
  description: "Group hikes, cleanups, and meetups happening with the OUTLY community.",
};

export default function EventsPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <EventListView />
    </div>
  );
}
