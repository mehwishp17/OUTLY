"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { EventCover } from "@/components/events/event-cover";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { ReviewSection } from "@/components/reviews/review-section";
import { useEventStore } from "@/context/event-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { fetchExploreItem } from "@/lib/api/places";
import type { ExplorePlace } from "@/types/place";
import { EVENT_CATEGORY_ICONS, EVENT_CATEGORY_LABELS, EVENT_VISIBILITY_LABELS } from "@/types/event";

type EventDetailViewProps = {
  eventId: string;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventDetailView({ eventId }: EventDetailViewProps) {
  const router = useRouter();
  const { currentUser } = useSocialStore();
  const { getEventById, deleteEvent, cancelEvent, joinEvent, leaveEvent, loadEvent } = useEventStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ variant: "success" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState<{ key: string; place?: ExplorePlace }>();
  const event = getEventById(eventId);
  const linkedKey = event?.placeId;
  const linkedPlace = linked && linked.key === linkedKey ? linked.place : undefined;

  useEffect(() => {
    let cancelled = false;
    void loadEvent(eventId).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, loadEvent]);

  // The place or trail this event is linked to (key like "place-3" or "trail-5").
  useEffect(() => {
    if (!linkedKey) return;
    const [kind, id] = linkedKey.split("-");
    let cancelled = false;
    void fetchExploreItem(kind === "trail" ? "trail" : "place", id).then((result) => {
      if (!cancelled) setLinked({ key: linkedKey, place: result.ok ? result.data : undefined });
    });
    return () => {
      cancelled = true;
    };
  }, [linkedKey]);

  if (!event && loading) return <LoadingState message="Loading event…" />;

  if (!event) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">Event not found</h1>
        <p className="text-sm text-[var(--outly-muted)]">
          This event may have been removed, or the link is incorrect.
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

  const isOrganizer = event.organizerId === currentUser.id;
  const myStatus = event.myStatus;
  const goingCount = event.goingCount;
  const pendingCount = event.participants.filter((p) => p.status === "pending").length;
  const canJoin = event.status === "upcoming" && !myStatus;

  async function handleJoin() {
    setBusy(true);
    const { result, error } = await joinEvent(event!.id);
    setBusy(false);
    if (error) {
      setJoinMessage({ variant: "error", text: error });
    } else if (result === "full") {
      setJoinMessage({ variant: "error", text: "This event is at capacity." });
    } else if (result === "requested") {
      setJoinMessage({ variant: "info", text: "Request sent — the organizer needs to approve you before you're confirmed." });
    } else {
      setJoinMessage({ variant: "success", text: "You're in! See you there." });
    }
  }

  async function handleLeave() {
    setBusy(true);
    const error = await leaveEvent(event!.id);
    setBusy(false);
    setJoinMessage(error ? { variant: "error", text: error } : null);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/events"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to events
      </Link>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)]">
        {event.coverUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--outly-lavender)]">
            <EventCover src={event.coverUrl} alt={`Cover image for ${event.title}`} className="group-hover:scale-100" />
          </div>
        ) : null}
        <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white gradient-brand"
              aria-hidden="true"
            >
              <Icon name={EVENT_CATEGORY_ICONS[event.category]} className="h-5.5 w-5.5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-2xl">
                {event.title}
              </h1>
              <p className="text-sm text-[var(--outly-muted)]">
                {EVENT_CATEGORY_LABELS[event.category]} · Organized by {isOrganizer ? currentUser.name || "You" : event.organizerName}
              </p>
            </div>
          </div>

          {isOrganizer ? (
            <DropdownMenu
              triggerLabel="Event actions"
              items={[
                { label: "Edit event", onSelect: () => router.push(`/events/${event.id}/edit`) },
                { label: "View participants", onSelect: () => router.push(`/events/${event.id}/participants`) },
                ...(event.status === "upcoming"
                  ? [
                      {
                        label: "Cancel event",
                        onSelect: async () => {
                          const error = await cancelEvent(event.id);
                          if (error) setJoinMessage({ variant: "error", text: error });
                        },
                      },
                    ]
                  : []),
                { label: "Delete event", destructive: true, onSelect: () => setConfirmingDelete(true) },
              ]}
            />
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {event.difficulty ? <DifficultyBadge difficulty={event.difficulty} /> : null}
          <span className="text-xs text-[var(--outly-muted)]">
            {EVENT_VISIBILITY_LABELS[event.visibility]}
          </span>
          {event.status === "cancelled" ? (
            <span className="rounded-full bg-[#fbe1e8] px-2.5 py-1 text-xs font-semibold text-[#b3164c]">
              Cancelled
            </span>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              When
            </dt>
            {/* Locale/timezone differ between server and browser. */}
            <dd suppressHydrationWarning className="mt-1 text-sm text-[var(--outly-ink)]">{formatDateTime(event.startAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              Where
            </dt>
            <dd className="mt-1 flex items-center gap-1 text-sm text-[var(--outly-ink)]">
              <Icon name="pin" className="h-3.5 w-3.5 text-[var(--outly-violet)]" />
              {event.location}
            </dd>
          </div>
          {event.meetingPoint ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
                Meeting point
              </dt>
              <dd className="mt-1 text-sm text-[var(--outly-ink)]">{event.meetingPoint}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              Capacity
            </dt>
            <dd className="mt-1 text-sm text-[var(--outly-ink)]">
              {goingCount}/{event.capacity} going
              {pendingCount > 0 ? ` · ${pendingCount} pending` : ""}
            </dd>
          </div>
        </dl>

        {linkedPlace ? (
          <Link
            href={linkedPlace.kind === "trail" ? `/explore/trails/${linkedPlace.id}` : `/explore/places/${linkedPlace.id}`}
            className="mt-5 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-4 py-3 text-sm font-semibold text-[var(--outly-purple-dark)] transition-colors hover:border-[var(--outly-violet)]/60"
          >
            <Icon name="map" className="h-4 w-4" />
            View {linkedPlace.name} on Explore
            <Icon name="arrow-right" className="ml-auto h-4 w-4" />
          </Link>
        ) : null}

        {event.description ? (
          <p className="mt-5 text-sm leading-relaxed text-[var(--outly-ink)]">{event.description}</p>
        ) : null}

        <div className="mt-6 border-t border-[var(--outly-border)] pt-5">
          {joinMessage ? (
            <Alert
              variant={joinMessage.variant}
              title={joinMessage.text}
              className="mb-4"
            />
          ) : null}

          {myStatus === "pending" ? (
            <Alert variant="info" title="Your request to join is pending organizer approval." className="mb-4" />
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/events/${event.id}/participants`}
              className="text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
            >
              View {goingCount} participant{goingCount === 1 ? "" : "s"}
            </Link>

            {!isOrganizer && event.status === "upcoming" ? (
              myStatus && myStatus !== "declined" ? (
                <Button variant="secondary" onClick={handleLeave} disabled={busy}>
                  {myStatus === "pending" ? "Withdraw request" : "Leave event"}
                </Button>
              ) : canJoin ? (
                <Button onClick={handleJoin} disabled={busy}>
                  {event.requiresApproval ? "Request to join" : "Join event"}
                </Button>
              ) : null
            ) : null}
          </div>
        </div>
        </div>
      </div>

      {event.status === "completed" ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <ReviewSection
            target="event"
            targetId={event.id}
            canWrite={myStatus === "going" && !isOrganizer}
            writeHint="Only people who joined this event can review it."
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this event?"
        description="This can't be undone."
        onConfirm={async () => {
          const error = await deleteEvent(event.id);
          setConfirmingDelete(false);
          if (error) {
            setJoinMessage({ variant: "error", text: error });
            return;
          }
          router.push("/events");
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
