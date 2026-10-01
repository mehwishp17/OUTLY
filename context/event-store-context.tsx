"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MOCK_EVENTS } from "@/lib/mock/mock-events";
import { useSocialStore } from "@/context/social-store-context";
import type { EventFormValues, OutlyEvent } from "@/types/event";

export type JoinEventResult = "joined" | "requested" | "full";

type EventStoreValue = {
  events: OutlyEvent[];
  getEventById: (eventId: string) => OutlyEvent | undefined;
  createEvent: (input: EventFormValues) => OutlyEvent;
  editEvent: (eventId: string, input: EventFormValues) => void;
  deleteEvent: (eventId: string) => void;
  cancelEvent: (eventId: string) => void;
  joinEvent: (eventId: string) => JoinEventResult;
  leaveEvent: (eventId: string) => void;
  approveParticipant: (eventId: string, userId: string) => void;
  rejectParticipant: (eventId: string, userId: string) => void;
};

const EventStoreContext = createContext<EventStoreValue | null>(null);

let localEventIdCounter = 0;

function nextEventId(): string {
  localEventIdCounter += 1;
  return `event-local-${Date.now()}-${localEventIdCounter}`;
}

/** Number of participants counted against capacity — both confirmed
 * ("going") and awaiting approval ("pending") reserve a slot, matching
 * the Event Capacity Rule: capacity is checked at join time, in the same
 * step the participant record is created. */
function reservedSlots(event: OutlyEvent): number {
  return event.participants.filter((p) => p.status === "going" || p.status === "pending").length;
}

/**
 * Session-only mock "backend" for the Events module (Events List, Event
 * Detail, Create/Edit Event, Participants, Organizer View). Reads the
 * current user from `SocialStoreProvider` so events and profile data
 * always agree on who "you" are. Nothing here persists beyond the
 * current browser session.
 */
export function EventStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const [events, setEvents] = useState<OutlyEvent[]>(MOCK_EVENTS);

  const getEventById = useCallback(
    (eventId: string) => events.find((event) => event.id === eventId),
    [events],
  );

  const createEvent = useCallback(
    (input: EventFormValues) => {
      const newEvent: OutlyEvent = {
        id: nextEventId(),
        organizerId: currentUser.id,
        organizerName: currentUser.name,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        placeId: input.placeId,
        location: input.location.trim(),
        meetingPoint: input.meetingPoint?.trim() || undefined,
        startAt: input.startAt,
        capacity: input.capacity,
        difficulty: input.difficulty,
        requiresApproval: input.requiresApproval,
        visibility: input.visibility,
        status: "upcoming",
        participants: [{ id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, status: "going" }],
      };
      setEvents((current) => [newEvent, ...current]);
      return newEvent;
    },
    [currentUser],
  );

  const editEvent = useCallback((eventId: string, input: EventFormValues) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              title: input.title.trim(),
              description: input.description.trim(),
              category: input.category,
              placeId: input.placeId,
              location: input.location.trim(),
              meetingPoint: input.meetingPoint?.trim() || undefined,
              startAt: input.startAt,
              capacity: input.capacity,
              difficulty: input.difficulty,
              requiresApproval: input.requiresApproval,
              visibility: input.visibility,
            }
          : event,
      ),
    );
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }, []);

  const cancelEvent = useCallback((eventId: string) => {
    setEvents((current) =>
      current.map((event) => (event.id === eventId ? { ...event, status: "cancelled" } : event)),
    );
  }, []);

  const joinEvent = useCallback(
    (eventId: string): JoinEventResult => {
      const event = events.find((candidate) => candidate.id === eventId);
      if (!event) return "full";
      if (reservedSlots(event) >= event.capacity) return "full";

      const outcome: JoinEventResult = event.requiresApproval ? "requested" : "joined";

      setEvents((current) =>
        current.map((candidate) => {
          if (candidate.id !== eventId) return candidate;
          if (candidate.participants.some((p) => p.id === currentUser.id)) return candidate;
          return {
            ...candidate,
            participants: [
              ...candidate.participants,
              {
                id: currentUser.id,
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
                status: candidate.requiresApproval ? "pending" : "going",
              },
            ],
          };
        }),
      );

      return outcome;
    },
    [events, currentUser],
  );

  const leaveEvent = useCallback(
    (eventId: string) => {
      setEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? { ...event, participants: event.participants.filter((p) => p.id !== currentUser.id) }
            : event,
        ),
      );
    },
    [currentUser],
  );

  const approveParticipant = useCallback((eventId: string, userId: string) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              participants: event.participants.map((p) =>
                p.id === userId ? { ...p, status: "going" } : p,
              ),
            }
          : event,
      ),
    );
  }, []);

  const rejectParticipant = useCallback((eventId: string, userId: string) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              participants: event.participants.map((p) =>
                p.id === userId ? { ...p, status: "declined" } : p,
              ),
            }
          : event,
      ),
    );
  }, []);

  const value = useMemo<EventStoreValue>(
    () => ({
      events,
      getEventById,
      createEvent,
      editEvent,
      deleteEvent,
      cancelEvent,
      joinEvent,
      leaveEvent,
      approveParticipant,
      rejectParticipant,
    }),
    [
      events,
      getEventById,
      createEvent,
      editEvent,
      deleteEvent,
      cancelEvent,
      joinEvent,
      leaveEvent,
      approveParticipant,
      rejectParticipant,
    ],
  );

  return <EventStoreContext.Provider value={value}>{children}</EventStoreContext.Provider>;
}

export function useEventStore(): EventStoreValue {
  const context = useContext(EventStoreContext);
  if (!context) {
    throw new Error("useEventStore must be used within an EventStoreProvider");
  }
  return context;
}
