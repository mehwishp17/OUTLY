"use client";

import { useEffect, useState } from "react";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useNotificationStore } from "@/context/notification-store-context";

/** Notifications List. Briefly shows a loading state on mount — the same
 * honest "connecting" stand-in used by Chat and the Explore/Feed lists —
 * before rendering notifications newest first. There is no dedicated
 * error state here: this list has no per-item route that can 404 (every
 * notification just links to real, already-existing content), and with
 * no live network layer in this frontend-only phase there's no genuine
 * failure to react to, so `ErrorState` isn't force-fitted in without a
 * real trigger. */
export function NotificationListView() {
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timeout);
  }, []);

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
          <Button variant="secondary" className="w-fit" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState message="Loading notifications…" />
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
