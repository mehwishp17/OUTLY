import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { NotificationListView } from "@/components/notifications/notification-list-view";

export const metadata: Metadata = {
  title: "Notifications — OUTLY",
  description: "Follows, likes, comments, join requests, and updates from your groups and events.",
};

export default function NotificationsPage() {
  return (
    <FeedPageShell>
      <NotificationListView />
    </FeedPageShell>
  );
}
