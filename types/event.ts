import type { IconName } from "@/components/ui/icon";
import type { Difficulty } from "@/types/place";

/**
 * Shared types for the Events module (Events List, Event Detail,
 * Create/Edit Event, Participants, Organizer View). Data lives in
 * `context/event-store-context.tsx` for the browser session only —
 * frontend-only, same pattern as the activities/social modules.
 */

export type EventCategory = "hike" | "trail-run" | "cycling" | "camping" | "meetup" | "cleanup";

export type EventStatus = "upcoming" | "completed" | "cancelled";

export type EventVisibility = "public" | "followers" | "private";

export type EventParticipantStatus = "going" | "pending" | "declined";

export type EventParticipant = {
  id: string;
  name: string;
  avatarUrl?: string;
  status: EventParticipantStatus;
};

export type OutlyEvent = {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  category: EventCategory;
  placeId?: string;
  location: string;
  meetingPoint?: string;
  startAt: string;
  endAt?: string;
  capacity: number;
  difficulty?: Difficulty;
  requiresApproval: boolean;
  visibility: EventVisibility;
  status: EventStatus;
  participants: EventParticipant[];
};

export type EventFormValues = {
  title: string;
  description: string;
  category: EventCategory;
  placeId?: string;
  location: string;
  meetingPoint?: string;
  startAt: string;
  capacity: number;
  difficulty?: Difficulty;
  requiresApproval: boolean;
  visibility: EventVisibility;
};

export type EventFormErrors = Partial<Record<"title" | "location" | "startAt" | "capacity", string>>;

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  hike: "Hike",
  "trail-run": "Trail run",
  cycling: "Cycling",
  camping: "Camping",
  meetup: "Meetup",
  cleanup: "Cleanup drive",
};

export const EVENT_CATEGORY_ICONS: Record<EventCategory, IconName> = {
  hike: "trail",
  "trail-run": "compass",
  cycling: "bike",
  camping: "tent",
  meetup: "calendar",
  cleanup: "shield-check",
};

export const EVENT_VISIBILITY_LABELS: Record<EventVisibility, string> = {
  public: "Public",
  followers: "Followers only",
  private: "Only invited",
};
