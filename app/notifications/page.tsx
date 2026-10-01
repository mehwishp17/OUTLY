import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { NotificationListView } from "@/components/notifications/notification-list-view";

export const metadata: Metadata = {
  title: "Notifications — OUTLY",
  description: "Follows, likes, comments, join requests, and updates from your groups and events.",
};

export default function NotificationsPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <NotificationListView />
    </div>
  );
}
