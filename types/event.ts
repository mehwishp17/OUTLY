import type { IconName } from "@/components/ui/icon";
import type { Difficulty } from "@/types/place";

/**
 * Shared types for the Events module (Events List, Event Detail,
 * Create/Edit Event, Participants, Organizer View). Events come from the
 * OUTLY backend (`lib/api/events.ts`) and live in
 * `context/event-store-context.tsx`.
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
  /** Optional link to an Explore place/trail, as an `exploreKey` ("place-3" / "trail-5"). */
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
  /** Cover image served by the backend (absolute URL); absent when the organizer didn't add one. */
  coverUrl?: string;
  /** Moderation state: events may need a moderator's approval before they are open. */
  approvalStatus: "pending" | "approved" | "rejected";
  /** Confirmed participants (always present, including in list responses). */
  goingCount: number;
  /** The signed-in user's own status for this event, if they joined or asked to. */
  myStatus?: EventParticipantStatus;
  /** Who is taking part — loaded with the event's detail. */
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
  /** A newly chosen cover image to upload (create or replace). */
  coverFile?: File | null;
  /** True when the organizer removed the existing cover without choosing a new one. */
  removeCover?: boolean;
};

export type EventFormErrors = Partial<Record<"title" | "location" | "startAt" | "capacity" | "cover", string>>;

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
