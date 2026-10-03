import type { ActivityKind } from "@/types/activity";
import type { SkillLevel } from "@/types/profile";

/**
 * Shared types for the Adventure Partner module (Partner Requests,
 * Request Detail, Create Request, Join Requests). Requests come from the
 * OUTLY backend (`lib/api/partner.ts`) and live in
 * `context/partner-store-context.tsx`. Reuses `ActivityKind` (from
 * Activities) and `SkillLevel` (from Profile) rather than introducing
 * parallel enums.
 */

export type PartnerRequestStatus = "open" | "closed";

export type JoinRequestStatus = "pending" | "accepted" | "declined";

export type JoinRequest = {
  /** The join request's own id (used to accept/decline it). */
  id: string;
  /** The person asking to join. */
  userId: string;
  name: string;
  avatarUrl?: string;
  message?: string;
  status: JoinRequestStatus;
};

export type PartnerRequest = {
  id: string;
  authorId: string;
  authorName: string;
  activity: ActivityKind;
  destination: string;
  preferredAt: string;
  experienceLevel: SkillLevel;
  /** Total spots the poster is offering. */
  spots: number;
  /** Spots already taken by accepted partners (always present). */
  spotsFilled: number;
  description: string;
  status: PartnerRequestStatus;
  /** The signed-in user's own join request for this post, if they made one. */
  myJoinStatus?: JoinRequestStatus;
  /** Everyone who asked to join — loaded for the poster only. */
  joinRequests: JoinRequest[];
};

export type PartnerRequestFormValues = {
  activity: ActivityKind;
  destination: string;
  preferredAt: string;
  experienceLevel: SkillLevel;
  spots: number;
  description: string;
};

export type PartnerRequestFormErrors = Partial<
  Record<"destination" | "preferredAt" | "spots" | "description", string>
>;

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
