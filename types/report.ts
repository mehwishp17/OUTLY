/**
 * Shared types for Reporting & Moderation (the data layer behind the
 * Admin module's Reports and Moderation screens). Data lives in
 * `context/admin-store-context.tsx` for the browser session only —
 * frontend-only, same pattern as the other domain modules.
 */

export type ReportTargetType = "post" | "user";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "misinformation"
  | "other";

export type ReportStatus = "open" | "actioned" | "dismissed";

export type Report = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  /** Short label for the reported content/account, captured at report
   * time so the Admin Reports list reads clearly even if the target is
   * later hidden, suspended, or deleted. */
  targetLabel: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: string;
};

export type ModerationActionType =
  | "post_hidden"
  | "post_unhidden"
  | "user_suspended"
  | "user_reinstated"
  | "report_dismissed"
  | "report_actioned"
  | "place_verified"
  | "place_unverified"
  | "event_cancelled";

export type ModerationLogEntry = {
  id: string;
  action: ModerationActionType;
  targetLabel: string;
  note?: string;
  createdAt: string;
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment",
  inappropriate_content: "Inappropriate content",
  misinformation: "Misinformation",
  other: "Other",
};

export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  post_hidden: "Post hidden",
  post_unhidden: "Post restored",
  user_suspended: "User suspended",
  user_reinstated: "User reinstated",
  report_dismissed: "Report dismissed",
  report_actioned: "Report actioned",
  place_verified: "Place marked verified",
  place_unverified: "Place verification removed",
  event_cancelled: "Event cancelled",
};
