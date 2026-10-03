"use client";

import { useEffect } from "react";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useNotificationStore } from "@/context/notification-store-context";

/** Notifications List: loaded from the backend each time it is opened
 * (new ones also arrive live), newest first, with loading, error and
 * empty states. */
export function NotificationListView() {
  const { notifications, unreadCount, status, error, refresh, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            Follows, likes, comments, join requests, and updates from your groups and events.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button variant="secondary" className="w-fit shrink-0 whitespace-nowrap" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        ) : null}
      </div>

      {(status === "idle" || status === "loading") && sorted.length === 0 ? (
        <LoadingState message="Loading notifications…" />
      ) : status === "error" && sorted.length === 0 ? (
        <ErrorState
          title="We couldn't load your notifications"
          description={error ?? undefined}
          action={
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="bell"
          title="You're all caught up"
          description="New follows, likes, comments, and updates will show up here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </ul>
      )}
    </div>
  );
}
