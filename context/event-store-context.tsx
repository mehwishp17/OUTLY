"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";
import {
  cancelEventRequest,
  createEventRequest,
  decideParticipantRequest,
  deleteEventRequest,
  editEventRequest,
  fetchEvent,
  fetchEvents,
  joinEventRequest,
  leaveEventRequest,
} from "@/lib/api/events";
import type { EventFormValues, OutlyEvent } from "@/types/event";

export type JoinEventResult = "joined" | "requested" | "full";

type LoadStatus = "idle" | "loading" | "ready" | "error";
type LoadError = { message: string; status: number };

type EventStoreValue = {
  events: OutlyEvent[];
  status: LoadStatus;
  error: LoadError | null;
  /** (Re)loads upcoming and past events from the backend. */
  refresh: () => Promise<void>;
  /** Loads one event with its participants (for detail/edit/participants screens). */
  loadEvent: (eventId: string) => Promise<LoadError | null>;
  getEventById: (eventId: string) => OutlyEvent | undefined;
  /** Every mutation resolves with an error message on failure. */
  createEvent: (
    input: EventFormValues,
    onUploadProgress?: (percent: number) => void,
  ) => Promise<{ event?: OutlyEvent; error?: string }>;
  editEvent: (
    eventId: string,
    input: EventFormValues,
    onUploadProgress?: (percent: number) => void,
  ) => Promise<string | undefined>;
  deleteEvent: (eventId: string) => Promise<string | undefined>;
  cancelEvent: (eventId: string) => Promise<string | undefined>;
  /** The backend checks capacity inside a transaction, so "full" is authoritative. */
  joinEvent: (eventId: string) => Promise<{ result?: JoinEventResult; error?: string }>;
  leaveEvent: (eventId: string) => Promise<string | undefined>;
  approveParticipant: (eventId: string, userId: string) => Promise<string | undefined>;
  rejectParticipant: (eventId: string, userId: string) => Promise<string | undefined>;
};

const EventStoreContext = createContext<EventStoreValue | null>(null);

/**
 * Events module state (Events List, Event Detail, Create/Edit Event,
 * Participants), backed by the OUTLY backend (`lib/api/events.ts`). The
 * backend owns the Event Capacity Rule: joining is checked and recorded in
 * one transaction, so two people can never take the last spot.
 */
export function EventStoreProvider({ children }: { children: ReactNode }) {
  const { refreshProfileExtras } = useSocialStore();
  const [events, setEvents] = useState<OutlyEvent[]>([]);
  const eventsRef = useRef<OutlyEvent[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<LoadError | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const setList = useCallback((updater: (current: OutlyEvent[]) => OutlyEvent[]) => {
    const next = updater(eventsRef.current);
    eventsRef.current = next;
    setEvents(next);
  }, []);

  const refresh = useCallback((): Promise<void> => {
    if (inflight.current) return inflight.current;
    inflight.current = (async () => {
      setStatus((current) => (current === "ready" ? current : "loading"));
      const result = await fetchEvents();
      if (result.ok) {
        setError(null);
        setList((current) => {
          const known = new Map(current.map((event) => [event.id, event]));
          const merged = result.data.map((event) => {
            const before = known.get(event.id);
            return before && before.participants.length > 0 ? { ...event, participants: before.participants } : event;
          });
          const fresh = new Set(result.data.map((event) => event.id));
          return [...merged, ...current.filter((event) => !fresh.has(event.id))];
        });
        setStatus("ready");
      } else {
        setError({ message: result.message, status: result.status });
        setStatus("error");
      }
    })().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
  }, [setList]);

  const loadEvent = useCallback(
    async (eventId: string): Promise<LoadError | null> => {
      const result = await fetchEvent(eventId);
      if (!result.ok) return { message: result.message, status: result.status };
      setList((current) =>
        current.some((event) => event.id === eventId)
          ? current.map((event) => (event.id === eventId ? result.data : event))
          : [result.data, ...current],
      );
      return null;
    },
    [setList],
  );

  const getEventById = useCallback((eventId: string) => events.find((event) => event.id === eventId), [events]);

  const createEvent = useCallback(
    async (input: EventFormValues, onUploadProgress?: (percent: number) => void) => {
      const result = await createEventRequest(input, onUploadProgress);
      if (!result.ok) return { error: result.message };
      setList((current) => [result.data, ...current.filter((event) => event.id !== result.data.id)]);
      return { event: result.data };
    },
    [setList],
  );

  const editEvent = useCallback(
    async (eventId: string, input: EventFormValues, onUploadProgress?: (percent: number) => void) => {
      const result = await editEventRequest(eventId, input, onUploadProgress);
      if (!result.ok) return result.message;
      await loadEvent(eventId);
      return undefined;
    },
    [loadEvent],
  );

  const cancelEvent = useCallback(
    async (eventId: string) => {
      const result = await cancelEventRequest(eventId);
      if (!result.ok) return result.message;
      await loadEvent(eventId);
      return undefined;
    },
    [loadEvent],
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      const result = await deleteEventRequest(eventId);
      if (!result.ok) return result.message;
      setList((current) => current.filter((event) => event.id !== eventId));
      return undefined;
    },
    [setList],
  );

  const joinEvent = useCallback(
    async (eventId: string) => {
      const result = await joinEventRequest(eventId);
      if (!result.ok) {
        // 409 means the last spot went to someone else.
        return result.status === 409 ? { result: "full" as JoinEventResult } : { error: result.message };
      }
      await loadEvent(eventId);
      void refreshProfileExtras();
      return { result: (result.data.status === "PENDING" ? "requested" : "joined") as JoinEventResult };
    },
    [loadEvent, refreshProfileExtras],
  );

  const leaveEvent = useCallback(
    async (eventId: string) => {
      const result = await leaveEventRequest(eventId);
      if (!result.ok) return result.message;
      await loadEvent(eventId);
      return undefined;
    },
    [loadEvent],
  );

  const decide = useCallback(
    async (eventId: string, userId: string, approve: boolean) => {
      const result = await decideParticipantRequest(eventId, userId, approve);
      if (!result.ok) return result.status === 409 ? "This event is full." : result.message;
      await loadEvent(eventId);
      return undefined;
    },
    [loadEvent],
  );

  const approveParticipant = useCallback((eventId: string, userId: string) => decide(eventId, userId, true), [decide]);
  const rejectParticipant = useCallback((eventId: string, userId: string) => decide(eventId, userId, false), [decide]);

  const value = useMemo<EventStoreValue>(
    () => ({
      events,
      status,
      error,
      refresh,
      loadEvent,
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
    [events, status, error, refresh, loadEvent, getEventById, createEvent, editEvent, deleteEvent, cancelEvent, joinEvent, leaveEvent, approveParticipant, rejectParticipant],
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
