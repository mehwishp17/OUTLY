import type { ActivityKind } from "@/types/activity";
import type { SkillLevel } from "@/types/profile";

/**
 * Shared types for the Adventure Partner module (Partner Requests,
 * Request Detail, Create Request, Join Requests). Data lives in
 * `context/partner-store-context.tsx` for the browser session only —
 * frontend-only, same pattern as the other domain modules. Reuses
 * `ActivityKind` (from Activities) and `SkillLevel` (from Profile)
 * rather than introducing parallel enums.
 */

export type PartnerRequestStatus = "open" | "closed";

export type JoinRequestStatus = "pending" | "accepted" | "declined";

export type JoinRequest = {
  id: string;
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
  spots: number;
  description: string;
  status: PartnerRequestStatus;
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
