/**
 * Shared types for Reporting & Moderation and the Admin screens. Reports,
 * moderation actions and the audit log live in the OUTLY backend
 * (`lib/api/admin.ts`); the backend enforces who may do what, so these
 * screens only show what the signed-in staff role is allowed to see.
 */

export type ReportTargetType =
  | "post"
  | "comment"
  | "user"
  | "event"
  | "group"
  | "place"
  | "message"
  | "review";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "misinformation"
  | "other";

export type ReportStatus = "open" | "in_review" | "actioned" | "dismissed";

export type Report = {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  /** Short text about what was reported (the post's text, the person's name...). */
  targetLabel: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
};

/** What a moderator can do about a report (the backend rejects combinations that don't make sense). */
export type ModerationDecision = "NO_ACTION" | "WARNING" | "HIDE" | "DELETE" | "RESTRICT" | "SUSPEND";

export type ModerationLogEntry = {
  id: string;
  /** Raw backend action, e.g. "moderation.hide". */
  action: string;
  /** Human-readable summary of the action. */
  label: string;
  targetLabel: string;
  actorName: string;
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

/** Actions offered per kind of reported thing. */
export const DECISIONS_BY_TARGET: Record<ReportTargetType, { value: ModerationDecision; label: string }[]> = {
  post: [
    { value: "HIDE", label: "Hide" },
    { value: "DELETE", label: "Delete" },
    { value: "WARNING", label: "Warn author" },
  ],
  comment: [
    { value: "HIDE", label: "Hide" },
    { value: "DELETE", label: "Delete" },
    { value: "WARNING", label: "Warn author" },
  ],
  user: [
    { value: "WARNING", label: "Warn" },
    { value: "RESTRICT", label: "Restrict" },
    { value: "SUSPEND", label: "Suspend" },
  ],
  event: [
    { value: "HIDE", label: "Reject event" },
    { value: "DELETE", label: "Cancel event" },
    { value: "WARNING", label: "Warn organizer" },
  ],
  group: [
    { value: "DELETE", label: "Delete group" },
    { value: "WARNING", label: "Warn owner" },
  ],
  place: [
    { value: "HIDE", label: "Remove place" },
    { value: "WARNING", label: "Warn" },
  ],
  message: [
    { value: "DELETE", label: "Delete message" },
    { value: "WARNING", label: "Warn sender" },
  ],
  review: [
    { value: "HIDE", label: "Hide" },
    { value: "DELETE", label: "Delete" },
    { value: "WARNING", label: "Warn author" },
  ],
};
