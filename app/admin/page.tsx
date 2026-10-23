import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export const metadata: Metadata = {
  title: "Admin dashboard — OUTLY",
  description: "A platform-wide overview across users, content, places, and events.",
};

export default function AdminDashboardPage() {
  return (
    <FeedPageShell>
      <AdminAccessGate level="administrator">
        <AdminDashboardView />
      </AdminAccessGate>
    </FeedPageShell>
  );
}
