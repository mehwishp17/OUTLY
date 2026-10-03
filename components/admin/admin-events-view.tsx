"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useEventStore } from "@/context/event-store-context";
import { moderateEventRequest } from "@/lib/api/admin";
import { EVENT_CATEGORY_LABELS } from "@/types/event";

const STATUS_CLASSES: Record<string, string> = {
  upcoming: "bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]",
  completed: "bg-[#e6f4ea] text-[#1e7a3a]",
  cancelled: "bg-[#fbe1e8] text-[#b3164c]",
};

/** Admin Events (moderators): every event on the platform. Moderators can
 * approve or reject events waiting for approval and cancel upcoming ones,
 * reusing `cancelEvent` from `event-store-context` (the action the
 * organizer's own menu uses). */
export function AdminEventsView() {
  const { events, status, error, refresh, cancelEvent, loadEvent } = useEventStore();
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sorted = [...events].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  );

  async function handleCancel(eventId: string) {
    setActionError(undefined);
    const failure = await cancelEvent(eventId);
    if (failure) setActionError(failure);
  }

  async function handleModerate(eventId: string, approve: boolean) {
    setActionError(undefined);
    const result = await moderateEventRequest(eventId, approve);
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    await loadEvent(eventId);
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

      {actionError ? (
        <p role="alert" className="text-sm text-[#B3164C]">
          {actionError}
        </p>
      ) : null}

      {status === "loading" && events.length === 0 ? (
        <LoadingState message="Loading events…" />
      ) : status === "error" && events.length === 0 ? (
        <ErrorState title="We couldn't load events" description={error?.message} />
      ) : (
      <ul className="flex flex-col gap-2">
        {sorted.map((event) => {
          const goingCount = event.goingCount;
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

              {event.approvalStatus === "pending" ? (
                <div className="flex gap-2">
                  <Button size="md" onClick={() => handleModerate(event.id, true)}>
                    Approve
                  </Button>
                  <Button size="md" variant="secondary" onClick={() => handleModerate(event.id, false)}>
                    Reject
                  </Button>
                </div>
              ) : event.status === "upcoming" ? (
                <Button size="md" variant="secondary" onClick={() => handleCancel(event.id)}>
                  Cancel event
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}
