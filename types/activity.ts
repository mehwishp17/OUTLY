import type { IconName } from "@/components/ui/icon";
import type { Difficulty } from "@/types/place";

/**
 * Shared types for the Activities module (Activity List, Create Activity,
 * Activity Detail, Activity History). Data comes from the OUTLY backend via
 * `lib/api/activities.ts` and lives in `context/activity-store-context.tsx`.
 */

export type ActivityKind = "hike" | "trail-run" | "cycling" | "camping" | "meetup";

export type ActivityStatus = "planned" | "completed";

export type ActivityPrivacy = "public" | "followers" | "private";

export type ActivityParticipant = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Activity = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  type: ActivityKind;
  /** Optional link to an Explore place/trail, as an `exploreKey` ("place-3" / "trail-5"). */
  placeId?: string;
  location: string;
  startAt: string;
  endAt?: string;
  distanceKm?: number;
  durationLabel?: string;
  difficulty?: Difficulty;
  notes?: string;
  privacy: ActivityPrivacy;
  status: ActivityStatus;
  /** Cover image served by the backend (absolute URL); absent when the creator didn't add one. */
  coverUrl?: string;
  /** Total participants (always present, including in list responses). */
  participantCount: number;
  /** Who is taking part — loaded with the activity's detail. */
  participants: ActivityParticipant[];
};

export type CreateActivityInput = {
  title: string;
  type: ActivityKind;
  placeId?: string;
  location: string;
  startAt: string;
  distanceKm?: number;
  durationLabel?: string;
  difficulty?: Difficulty;
  notes?: string;
  privacy: ActivityPrivacy;
  status: ActivityStatus;
  /** A newly chosen cover image to upload (create or replace). */
  coverFile?: File | null;
  /** True when the creator removed the existing cover without choosing a new one. */
  removeCover?: boolean;
};

export type EditActivityInput = CreateActivityInput;

export type ActivityFormErrors = Partial<Record<"title" | "location" | "startAt", string>>;

export const ACTIVITY_TYPE_LABELS: Record<ActivityKind, string> = {
  hike: "Hike",
  "trail-run": "Trail run",
  cycling: "Cycling",
  camping: "Camping",
  meetup: "Meetup",
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityKind, IconName> = {
  hike: "trail",
  "trail-run": "compass",
  cycling: "bike",
  camping: "tent",
  meetup: "calendar",
};

export const ACTIVITY_PRIVACY_LABELS: Record<ActivityPrivacy, string> = {
  public: "Public",
  followers: "Followers only",
  private: "Only me",
};
