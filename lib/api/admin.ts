import { callBackend, fetchAll, firstError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";
import type {
  ModerationDecision,
  ModerationLogEntry,
  Report,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/types/report";

/**
 * Reporting, moderation and admin client (`/api/backend/...`). Everything
 * under `admin/` and the moderator queue is authorised by the backend from
 * the signed-in account's role (moderators: reports, content, events;
 * administrators: also users, places, audit log and analytics).
 *
 *   POST   reports/                          anyone: report a post, person, ...
 *   GET    admin/reports/                    moderator queue
 *   POST   admin/reports/{id}/action/        decide (hide, delete, warn, restrict, suspend, no action)
 *   GET    admin/users/ , PATCH admin/users/{id}/
 *   GET    admin/posts/ , PATCH admin/posts/{id}/
 *   PATCH  admin/places/{id}/ , admin/trails/{id}/
 *   PATCH  events/{id}/moderate/
 *   GET    admin/audit-logs/ , admin/analytics/overview/
 */

const withMessage = <T>(result: ApiResult<T>): ApiResult<T> => (result.ok ? result : { ...result, message: firstError(result) });

// ---------------- reporting (any signed-in user) ----------------
const REASON_TO_BACKEND: Record<ReportReason, string> = {
  spam: "SPAM",
  harassment: "HARASSMENT",
  inappropriate_content: "INAPPROPRIATE",
  misinformation: "MISINFORMATION",
  other: "OTHER",
};

export type NewReport = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
};

export async function createReportRequest(input: NewReport): Promise<ApiResult<unknown>> {
  return withMessage(
    await callBackend("POST", "reports", {
      target_type: input.targetType.toUpperCase(),
      target_id: Number(input.targetId),
      reason: REASON_TO_BACKEND[input.reason],
      description: input.description?.trim() ?? "",
    }),
  );
}

// ---------------- moderator queue ----------------
type BackendReport = {
  id: number;
  reporter_id: number;
  reporter_name?: string;
  target_type: string;
  target_id: number;
  target_label?: string | null;
  reason: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
};

const STATUS_FROM: Record<string, ReportStatus> = {
  OPEN: "open",
  IN_REVIEW: "in_review",
  RESOLVED: "actioned",
  DISMISSED: "dismissed",
};

export function mapReport(raw: BackendReport): Report {
  const reporterId = rememberBackendUser({ user_id: raw.reporter_id, username: raw.reporter_name, display_name: raw.reporter_name });
  return {
    id: String(raw.id),
    reporterId,
    reporterName: raw.reporter_name || "a deleted account",
    targetType: raw.target_type.toLowerCase() as ReportTargetType,
    targetId: String(raw.target_id),
    targetLabel: raw.target_label || `${raw.target_type.toLowerCase()} #${raw.target_id}`,
    reason: raw.reason,
    description: raw.description || undefined,
    status: STATUS_FROM[raw.status] ?? "open",
    priority: raw.priority.toLowerCase() as Report["priority"],
    createdAt: raw.created_at,
  };
}

export async function fetchReports(): Promise<ApiResult<Report[]>> {
  const result = await fetchAll<BackendReport>("admin/reports", 200);
  return result.ok ? { ok: true, data: result.data.map(mapReport) } : result;
}

export async function decideReport(reportId: string, decision: ModerationDecision, notes: string): Promise<ApiResult<unknown>> {
  return withMessage(await callBackend("POST", `admin/reports/${reportId}/action`, { action: decision, notes }));
}

// ---------------- users (administrators) ----------------
export type AdminUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  status: string;
};

type BackendAdminUser = { user_id: number; email: string; username: string; display_name?: string; role: string; status: string };

export async function fetchAdminUsers(search: string): Promise<ApiResult<AdminUser[]>> {
  const query = search.trim() ? `admin/users?search=${encodeURIComponent(search.trim())}` : "admin/users";
  const result = await fetchAll<BackendAdminUser>(query, 200);
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data.map((raw) => {
      const id = rememberBackendUser({ user_id: raw.user_id, username: raw.username, display_name: raw.display_name });
      return { id, email: raw.email, username: raw.username, name: raw.display_name || raw.username, role: raw.role, status: raw.status };
    }),
  };
}

export async function setUserStatusRequest(userId: string, status: "ACTIVE" | "SUSPENDED"): Promise<ApiResult<unknown>> {
  return withMessage(await callBackend("PATCH", `admin/users/${userId}`, { status }));
}

// ---------------- posts (moderators) ----------------
export type AdminPost = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  groupId?: string;
  commentCount: number;
  createdAt: string;
};

type BackendAdminPost = {
  id: number;
  author_id: number;
  author_username: string;
  caption: string;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  group_id?: number | null;
  comments_count: number;
  created_at: string;
};

export async function fetchAdminPosts(): Promise<ApiResult<AdminPost[]>> {
  const result = await fetchAll<BackendAdminPost>("admin/posts", 200);
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data.map((raw) => ({
      id: String(raw.id),
      authorId: String(raw.author_id),
      authorName: raw.author_username,
      content: raw.caption,
      status: raw.status,
      groupId: raw.group_id ? String(raw.group_id) : undefined,
      commentCount: raw.comments_count,
      createdAt: raw.created_at,
    })),
  };
}

export async function setPostStatusRequest(postId: string, status: "ACTIVE" | "HIDDEN" | "DELETED"): Promise<ApiResult<unknown>> {
  return withMessage(await callBackend("PATCH", `admin/posts/${postId}`, { status }));
}

// ---------------- places, events (verification / approval) ----------------
export async function setPlaceVerifiedRequest(kind: "place" | "trail", id: string, verified: boolean): Promise<ApiResult<unknown>> {
  return withMessage(await callBackend("PATCH", `admin/${kind === "trail" ? "trails" : "places"}/${id}`, { is_verified: verified }));
}

export async function moderateEventRequest(eventId: string, approve: boolean): Promise<ApiResult<unknown>> {
  return withMessage(await callBackend("PATCH", `events/${eventId}/moderate`, { approval_status: approve ? "APPROVED" : "REJECTED" }));
}

// ---------------- audit log (administrators) ----------------
type BackendAudit = {
  id: number;
  actor_label?: string;
  action: string;
  target_type?: string;
  target_id?: number | null;
  metadata?: Record<string, unknown>;
  created_at: string;
};

const AUDIT_LABELS: Record<string, string> = {
  "moderation.hide": "Content hidden",
  "moderation.delete": "Content removed",
  "moderation.warning": "Warning issued",
  "moderation.restrict": "Account restricted",
  "moderation.suspend": "Account suspended",
  "moderation.no_action": "Report dismissed",
  "admin.user.update": "Account updated",
  "admin.post.status": "Post status changed",
  "admin.place.update": "Place updated",
  "admin.trail.update": "Trail updated",
  "event.approved": "Event approved",
  "event.rejected": "Event rejected",
  "organizer.approved": "Organizer approved",
  "organizer.rejected": "Organizer rejected",
};

export function describeAudit(action: string): string {
  return AUDIT_LABELS[action] ?? action.replace(/[._]/g, " ");
}

export async function fetchAuditLog(): Promise<ApiResult<ModerationLogEntry[]>> {
  const result = await fetchAll<BackendAudit>("admin/audit-logs", 200);
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data.map((raw) => {
      const notes = typeof raw.metadata?.notes === "string" ? raw.metadata.notes : undefined;
      return {
        id: String(raw.id),
        action: raw.action,
        label: describeAudit(raw.action),
        targetLabel: raw.target_type ? `${raw.target_type} #${raw.target_id ?? ""}`.trim() : "",
        actorName: raw.actor_label || "system",
        note: notes || undefined,
        createdAt: raw.created_at,
      };
    }),
  };
}

// ---------------- analytics (administrators) ----------------
export type Overview = {
  users: { total: number; suspended: number };
  posts: { total: number; hidden: number; group_posts: number };
  events: { total: number; upcoming: number; completed: number; cancelled: number; pending_approval: number };
  groups: { total: number };
  activities: { total: number; completed: number; by_type: Record<string, number> };
  partner_requests: { open: number; total: number };
  content?: { places: number; trails: number };
  moderation: { reports_by_status: Record<string, number>; open_high_priority: number };
};

export function fetchOverview(): Promise<ApiResult<Overview>> {
  return callBackend<Overview>("GET", "admin/analytics/overview");
}
