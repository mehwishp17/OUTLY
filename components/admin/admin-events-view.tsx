"use client";

import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { useAdminStore } from "@/context/admin-store-context";
import { useEventStore } from "@/context/event-store-context";
import { EVENT_CATEGORY_LABELS } from "@/types/event";

const STATUS_CLASSES: Record<string, string> = {
  upcoming: "bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]",
  completed: "bg-[#e6f4ea] text-[#1e7a3a]",
  cancelled: "bg-[#fbe1e8] text-[#b3164c]",
};

/** Admin Events: every event, reusing `cancelEvent` from
 * `event-store-context` (the same action the organizer's own dropdown
 * uses) rather than a parallel admin-only cancellation path. */
export function AdminEventsView() {
  const { events, cancelEvent } = useEventStore();
  const { logAction } = useAdminStore();

  const sorted = [...events].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  );

  function handleCancel(eventId: string, title: string) {
    cancelEvent(eventId);
    logAction("event_cancelled", title);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Events
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">Every event on the platform.</p>
      </div>

      <AdminNav active="/admin/events" />

      <ul className="flex flex-col gap-2">
        {sorted.map((event) => {
          const goingCount = event.participants.filter((p) => p.status === "going").length;
          return (
            <li
              key={event.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/events/${event.id}`}
                    className="truncate text-sm font-semibold text-[var(--outly-ink)] hover:text-[var(--outly-violet)]"
                  >
                    {event.title}
                  </Link>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASSES[event.status]}`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--outly-muted)]">
                  {EVENT_CATEGORY_LABELS[event.category]} · Organized by {event.organizerName} ·{" "}
                  {goingCount}/{event.capacity} going
                </p>
              </div>

              {event.status === "upcoming" ? (
                <Button size="md" variant="secondary" onClick={() => handleCancel(event.id, event.title)}>
                  Cancel event
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
