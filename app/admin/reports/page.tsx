import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AdminReportsView } from "@/components/admin/admin-reports-view";

export const metadata: Metadata = {
  title: "Admin reports — OUTLY",
  description: "Reports filed by the community against posts and accounts.",
};

export default function AdminReportsPage() {
  return (
    <FeedPageShell>
      <AdminAccessGate level="moderator">
        <AdminReportsView />
      </AdminAccessGate>
    </FeedPageShell>
  );
}
