import type { IconName } from "@/components/ui/icon";

/**
 * Shared types for the Notifications module. Data lives in
 * `context/notification-store-context.tsx` for the browser session only
 * — frontend-only, same pattern as the other domain modules. Covers
 * every notification category named in the Notification Module
 * requirements (follows, likes, comments, join requests, event
 * approvals/reminders, group activity, messages, reviews, moderation).
 */

export type NotificationType =
  | "follow"
  | "like"
  | "comment"
  | "join_request"
  | "event_approval"
  | "event_reminder"
  | "group_activity"
  | "message"
  | "review"
  | "moderation";

export type OutlyNotification = {
  id: string;
  type: NotificationType;
  /** Who triggered it, when applicable (a person, not the system). */
  actorId?: string;
  title: string;
  body?: string;
  /** Where clicking the notification navigates — the real screen the
   * notification is about (a post, event, group, conversation, etc.)
   * rather than a separate "Notification Detail" screen. */
  href: string;
  createdAt: string;
  read: boolean;
};

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, IconName> = {
  follow: "compass",
  like: "heart-filled",
  comment: "message-circle",
  join_request: "plus",
  event_approval: "check-circle",
  event_reminder: "calendar",
  group_activity: "tent",
  message: "message-circle",
  review: "star-filled",
  moderation: "shield-check",
};
