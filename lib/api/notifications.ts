import { callBackend, callBackendPage } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberUser } from "@/lib/user-directory";
import type { NotificationType, OutlyNotification } from "@/types/notification";

/**
 * Notifications client (`/api/backend/notifications/...`):
 *   GET  notifications/                list, newest first (?is_read=false)
 *   GET  notifications/unread-count/
 *   POST notifications/{id}/read/      mark one read
 *   POST notifications/read-all/
 *   DELETE notifications/{id}/         dismiss
 */

export type BackendNotification = {
  id: number;
  actor_id: number | null;
  actor_name?: string;
  notification_type: string;
  title: string;
  body?: string;
  href?: string;
  is_read: boolean;
  created_at: string;
};

const TYPE_MAP: Record<string, NotificationType> = {
  FOLLOW: "follow",
  FOLLOW_REQUEST: "follow",
  LIKE: "like",
  COMMENT: "comment",
  MESSAGE: "message",
  GROUP_JOIN: "group_activity",
  GROUP_POST: "group_activity",
  GROUP_REQUEST: "join_request",
  PARTNER_REQUEST: "join_request",
  PARTNER_JOIN: "join_request",
  EVENT_JOIN: "join_request",
  EVENT_APPROVAL: "event_approval",
  EVENT_REMINDER: "event_reminder",
  REVIEW: "review",
  BADGE: "badge",
  MODERATION: "moderation",
  SYSTEM: "system",
};

export function mapNotification(raw: BackendNotification): OutlyNotification {
  let actorId: string | undefined;
  if (raw.actor_id) {
    actorId = String(raw.actor_id);
    rememberUser({ id: actorId, name: raw.actor_name });
  }
  return {
    id: String(raw.id),
    type: TYPE_MAP[raw.notification_type] ?? "system",
    actorId,
    title: raw.title,
    body: raw.body || undefined,
    href: raw.href || "/notifications",
    createdAt: raw.created_at,
    read: raw.is_read,
  };
}

export async function fetchNotifications(): Promise<ApiResult<{ items: OutlyNotification[]; unread: number }>> {
  const first = await callBackendPage<BackendNotification>("notifications?limit=100");
  if (!first.ok) return first;
  const unread = typeof first.data.meta.unread_count === "number" ? first.data.meta.unread_count : undefined;
  return {
    ok: true,
    data: {
      items: first.data.items.map(mapNotification),
      unread: unread ?? first.data.items.filter((n) => !n.is_read).length,
    },
  };
}

export async function fetchUnreadCount(): Promise<ApiResult<number>> {
  const result = await callBackend<{ unread_count: number }>("GET", "notifications/unread-count");
  return result.ok ? { ok: true, data: result.data.unread_count } : result;
}

export function markReadRequest(id: string): Promise<ApiResult<unknown>> {
  return callBackend("POST", `notifications/${id}/read`);
}

export function markAllReadRequest(): Promise<ApiResult<unknown>> {
  return callBackend("POST", "notifications/read-all");
}

export function dismissRequest(id: string): Promise<ApiResult<void>> {
  return callBackend<void>("DELETE", `notifications/${id}`);
}

