"use client";

import { useEffect } from "react";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { Tabs } from "@/components/ui/tabs";
import { useEventStore } from "@/context/event-store-context";
import type { OutlyEvent } from "@/types/event";

function sortByStartAtAsc(events: OutlyEvent[]): OutlyEvent[] {
  return [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

function EventGroup({ events }: { events: OutlyEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

/** Events List: "Upcoming" / "Past" / "All" tabs over every event. */
export function EventListView() {
  const { events, status, error, refresh } = useEventStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sorted = sortByStartAtAsc(events);
  const upcoming = sorted.filter((event) => event.status === "upcoming");
  const past = sorted.filter((event) => event.status !== "upcoming");

  // Loading/error show inside the tabs, so the selected tab survives the data arriving.
  const notice =
    status === "loading" && events.length === 0 ? (
        <LoadingState message="Loading events…" />
    ) : status === "error" && events.length === 0 ? (
        <ErrorState
          title="We couldn't load events"
          description={error?.message}
          action={
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
    ) : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Events
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            Group hikes, cleanups, and meetups happening with the OUTLY community.
          </p>
        </div>
        <Button href="/events/new" className="w-fit">
          <Icon name="plus" className="h-4 w-4" />
          Create event
        </Button>
      </div>

      <Tabs
        ariaLabel="Event filters"
        items={[
          { id: "upcoming", label: `Upcoming (${upcoming.length})`, content: notice ?? <EventGroup events={upcoming} /> },
          { id: "past", label: `Past (${past.length})`, content: notice ?? <EventGroup events={past} /> },
          { id: "all", label: "All", content: notice ?? <EventGroup events={sorted} /> },
        ]}
      />
    </div>
  );
}
