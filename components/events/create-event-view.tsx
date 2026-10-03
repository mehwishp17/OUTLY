"use client";

import { useRouter } from "next/navigation";
import { EventComposer } from "@/components/events/event-composer";
import { useEventStore } from "@/context/event-store-context";

export function CreateEventView() {
  const router = useRouter();
  const { createEvent } = useEventStore();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <EventComposer
        title="Create an event"
        description="Organize a group hike, cleanup, or meetup for the OUTLY community."
        submitLabel="Create event"
        onCancel={() => router.push("/events")}
        onSubmit={async (values) => {
          const { event, error } = await createEvent(values);
          if (error || !event) return error;
          router.push(`/events/${event.id}`);
          return undefined;
        }}
      />
    </div>
  );
}
