import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AdminAnalyticsView } from "@/components/admin/admin-analytics-view";

export const metadata: Metadata = {
  title: "Admin analytics — OUTLY",
  description: "A snapshot of platform activity across content, activities, and events.",
};

export default function AdminAnalyticsPage() {
  return (
    <FeedPageShell>
      <AdminAccessGate level="administrator">
        <AdminAnalyticsView />
      </AdminAccessGate>
    </FeedPageShell>
  );
}
