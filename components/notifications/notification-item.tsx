"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useNotificationStore } from "@/context/notification-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { cn, formatRelativeTime } from "@/lib/utils";
import { resolveUserSummary } from "@/lib/user-directory";
import { NOTIFICATION_TYPE_ICONS } from "@/types/notification";
import type { OutlyNotification } from "@/types/notification";

type NotificationItemProps = {
  notification: OutlyNotification;
};

/** A single notification row. Clicking it marks the notification read
 * and navigates straight to the real screen it's about (the post,
 * event, group, conversation, etc.) rather than a separate detail page. */
export function NotificationItem({ notification }: NotificationItemProps) {
  const { currentUser } = useSocialStore();
  const { markAsRead, dismiss } = useNotificationStore();
  const actor = notification.actorId ? resolveUserSummary(notification.actorId, currentUser) : undefined;

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        notification.read
          ? "border-[var(--outly-border)] bg-white"
          : "border-[var(--outly-violet)]/30 bg-[var(--outly-lavender)]",
      )}
    >
      <Link
        href={notification.href}
        onClick={() => markAsRead(notification.id)}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        {actor ? (
          <Avatar name={actor.name} avatarUrl={actor.avatarUrl} size="md" />
        ) : (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white gradient-brand"
            aria-hidden="true"
          >
            <Icon name={NOTIFICATION_TYPE_ICONS[notification.type]} className="h-4.5 w-4.5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--outly-ink)]">
            {!notification.read ? (
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[var(--outly-violet)]" />
            ) : null}
            <span className="min-w-0 truncate">{notification.title}</span>
            {!notification.read ? <span className="sr-only">(unread)</span> : null}
          </p>
          {notification.body ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-[var(--outly-muted)]">{notification.body}</p>
          ) : null}
          <p className="mt-1 text-xs text-[var(--outly-muted)]">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => dismiss(notification.id)}
        aria-label="Dismiss notification"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--outly-muted)] transition-colors hover:bg-white hover:text-[var(--outly-violet)]"
      >
        <Icon name="close" className="h-4 w-4" />
      </button>
    </li>
  );
}
