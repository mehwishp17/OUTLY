"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";
import {
  dismissRequest,
  fetchNotifications,
  fetchUnreadCount,
  mapNotification,
  markAllReadRequest,
  markReadRequest,
} from "@/lib/api/notifications";
import type { BackendNotification } from "@/lib/api/notifications";
import {
  isRealtimeConnected,
  startRealtime,
  stopRealtime,
  subscribeRealtime,
  subscribeRealtimeStatus,
} from "@/lib/realtime";
import type { OutlyNotification } from "@/types/notification";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type NotificationStoreValue = {
  notifications: OutlyNotification[];
  unreadCount: number;
  status: LoadStatus;
  error: string | null;
  /** (Re)loads the list from the backend. */
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismiss: (notificationId: string) => void;
};

const NotificationStoreContext = createContext<NotificationStoreValue | null>(null);

const POLL_MS = 30_000;

/**
 * Notifications state, backed by the OUTLY backend
 * (`lib/api/notifications.ts`). New notifications arrive live over the
 * WebSocket (`lib/realtime.ts`); while the socket is down the unread count
 * is polled every 30 s. This provider also owns the socket's lifetime: it
 * connects once the user is signed in and disconnects on log out.
 */
export function NotificationStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const meId = currentUser.id;
  const [notifications, setNotifications] = useState<OutlyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const notificationsRef = useRef<OutlyNotification[]>([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const refresh = useCallback(async () => {
    setStatus((current) => (current === "ready" ? current : "loading"));
    const result = await fetchNotifications();
    if (result.ok) {
      setNotifications(result.data.items);
      setUnreadCount(result.data.unread);
      setError(null);
      setStatus("ready");
      loadedRef.current = true;
    } else {
      setError(result.message);
      setStatus("error");
    }
  }, []);

  // Signed in: open the live channel and load the unread badge.
  useEffect(() => {
    if (!meId) return;
    startRealtime();
    void fetchUnreadCount().then((result) => {
      if (result.ok) setUnreadCount(result.data);
    });
    return () => {
      stopRealtime();
    };
  }, [meId]);

  // New notifications pushed over the socket.
  useEffect(() => {
    return subscribeRealtime((event) => {
      if (event.type !== "notification.created") return;
      const raw = event.notification as BackendNotification | undefined;
      if (!raw) return;
      const incoming = mapNotification(raw);
      setNotifications((current) => (current.some((n) => n.id === incoming.id) ? current : [incoming, ...current]));
      if (typeof event.unread_count === "number") setUnreadCount(event.unread_count);
    });
  }, []);

  // Without a live socket, poll the unread count (and the list if it is open).
  useEffect(() => {
    if (!meId) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      if (isRealtimeConnected()) return;
      timer = setInterval(() => {
        void fetchUnreadCount().then((result) => {
          if (!result.ok) return;
          setUnreadCount((current) => {
            if (result.data !== current && loadedRef.current) void refresh();
            return result.data;
          });
        });
      }, POLL_MS);
    };
    sync();
    const unsubscribe = subscribeRealtimeStatus(sync);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [meId, refresh]);

  const markAsRead = useCallback((notificationId: string) => {
    const target = notificationsRef.current.find((notification) => notification.id === notificationId);
    if (target && !target.read) {
      setNotifications((current) =>
        current.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    void markReadRequest(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    setUnreadCount(0);
    void markAllReadRequest();
  }, []);

  const dismiss = useCallback((notificationId: string) => {
    const target = notificationsRef.current.find((notification) => notification.id === notificationId);
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    if (target && !target.read) setUnreadCount((count) => Math.max(0, count - 1));
    void dismissRequest(notificationId);
  }, []);

  const value = useMemo<NotificationStoreValue>(
    () => ({ notifications, unreadCount, status, error, refresh, markAsRead, markAllAsRead, dismiss }),
    [notifications, unreadCount, status, error, refresh, markAsRead, markAllAsRead, dismiss],
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
