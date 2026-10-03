"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { useEventStore } from "@/context/event-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { displayPerson } from "@/lib/user-directory";
import type { EventParticipant } from "@/types/event";

type EventParticipantsViewProps = {
  eventId: string;
};

function ParticipantRow({
  participant,
  isOrganizer,
  onApprove,
  onReject,
}: {
  participant: EventParticipant;
  isOrganizer: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { currentUser } = useSocialStore();
  const person = displayPerson(participant, currentUser);
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-white p-4">
      <Avatar name={person.name} avatarUrl={person.avatarUrl} size="sm" />
      <span className="flex-1 text-sm font-semibold text-[var(--outly-ink)]">{person.name}</span>
      {participant.status === "pending" ? (
        isOrganizer ? (
          <div className="flex gap-2">
            <Button size="md" onClick={onApprove}>
              Approve
            </Button>
            <Button size="md" variant="secondary" onClick={onReject}>
              Decline
            </Button>
          </div>
        ) : (
          <span className="rounded-full bg-[var(--outly-lavender)] px-2.5 py-1 text-xs font-semibold text-[var(--outly-purple-dark)]">
            Pending
          </span>
        )
      ) : participant.status === "declined" ? (
        <span className="rounded-full bg-[#fbe1e8] px-2.5 py-1 text-xs font-semibold text-[#b3164c]">
          Declined
        </span>
      ) : (
        <span className="rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-semibold text-[#1e7a3a]">
          Going
        </span>
      )}
    </li>
  );
}

/** Participants screen: full participant list, with approve/decline
 * controls for the organizer when the event requires approval — the
 * frontend counterpart to the Event Participant Workflow. */
export function EventParticipantsView({ eventId }: EventParticipantsViewProps) {
  const { currentUser } = useSocialStore();
  const { getEventById, approveParticipant, rejectParticipant, loadEvent } = useEventStore();
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string>();
  const event = getEventById(eventId);

  useEffect(() => {
    let cancelled = false;
    void loadEvent(eventId).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, loadEvent]);

  async function decide(action: Promise<string | undefined>) {
    setActionError(undefined);
    const error = await action;
    if (error) setActionError(error);
  }

  if (!event && loading) return <LoadingState message="Loading participants…" />;

  if (!event) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">Event not found</h1>
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
  const going = event.participants.filter((p) => p.status === "going");
  const pending = event.participants.filter((p) => p.status === "pending");
  const declined = event.participants.filter((p) => p.status === "declined");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href={`/events/${event.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to event
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)]">Participants</h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">{event.title}</p>
      </div>

      {actionError ? (
        <p role="alert" className="text-sm text-[#B3164C]">
          {actionError}
        </p>
      ) : null}

      {pending.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Pending requests ({pending.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {pending.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                isOrganizer={isOrganizer}
                onApprove={() => decide(approveParticipant(event.id, participant.id))}
                onReject={() => decide(rejectParticipant(event.id, participant.id))}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
          Going ({going.length}/{event.capacity})
        </h2>
        {going.length === 0 ? (
          <p className="text-sm text-[var(--outly-muted)]">No one has joined yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {going.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                isOrganizer={isOrganizer}
                onApprove={() => decide(approveParticipant(event.id, participant.id))}
                onReject={() => decide(rejectParticipant(event.id, participant.id))}
              />
            ))}
          </ul>
        )}
      </div>

      {declined.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Declined ({declined.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {declined.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                isOrganizer={isOrganizer}
                onApprove={() => decide(approveParticipant(event.id, participant.id))}
                onReject={() => decide(rejectParticipant(event.id, participant.id))}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
