"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EventComposer } from "@/components/events/event-composer";
import { Icon } from "@/components/ui/icon";
import { useEventStore } from "@/context/event-store-context";
import { useSocialStore } from "@/context/social-store-context";

type EditEventViewProps = {
  eventId: string;
};

export function EditEventView({ eventId }: EditEventViewProps) {
  const router = useRouter();
  const { currentUser } = useSocialStore();
  const { getEventById, editEvent } = useEventStore();
  const event = getEventById(eventId);

  if (!event || event.organizerId !== currentUser.id) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">
          {event ? "You can't edit this event" : "Event not found"}
        </h1>
        <p className="text-sm text-[var(--outly-muted)]">
          {event
            ? "Only the organizer can edit an event."
            : "This event may have been removed, or the link is incorrect."}
        </p>
        <Link
          href="/events"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <EventComposer
        title="Edit event"
        submitLabel="Save changes"
        initialValues={event}
        onCancel={() => router.push(`/events/${event.id}`)}
        onSubmit={(values) => {
          editEvent(event.id, values);
          router.push(`/events/${event.id}`);
        }}
      />
    </div>
  );
}
