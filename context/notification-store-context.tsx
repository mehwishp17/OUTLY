"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MOCK_NOTIFICATIONS } from "@/lib/mock/mock-notifications";
import type { OutlyNotification } from "@/types/notification";

type NotificationStoreValue = {
  notifications: OutlyNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismiss: (notificationId: string) => void;
};

const NotificationStoreContext = createContext<NotificationStoreValue | null>(null);

/**
 * Session-only mock "backend" for the Notifications module. Seed
 * notifications link to real content already created by the other
 * domain modules (posts, events, groups, conversations, partner
 * requests) — there is no live notification-generation pipeline in this
 * frontend-only phase (that would require simulating other users acting
 * asynchronously, which is out of scope here). Nothing here persists
 * beyond the current browser session.
 */
export function NotificationStoreProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<OutlyNotification[]>(MOCK_NOTIFICATIONS);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, []);

  const dismiss = useCallback((notificationId: string) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo<NotificationStoreValue>(
    () => ({ notifications, unreadCount, markAsRead, markAllAsRead, dismiss }),
    [notifications, unreadCount, markAsRead, markAllAsRead, dismiss],
  );

  return (
    <NotificationStoreContext.Provider value={value}>{children}</NotificationStoreContext.Provider>
  );
}

export function useNotificationStore(): NotificationStoreValue {
  const context = useContext(NotificationStoreContext);
  if (!context) {
    throw new Error("useNotificationStore must be used within a NotificationStoreProvider");
  }
  return context;
}
