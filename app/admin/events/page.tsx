import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AdminEventsView } from "@/components/admin/admin-events-view";

export const metadata: Metadata = {
  title: "Admin events — OUTLY",
  description: "Every event on the platform.",
};

export default function AdminEventsPage() {
  return (
    <FeedPageShell>
      <AdminAccessGate level="moderator">
        <AdminEventsView />
      </AdminAccessGate>
    </FeedPageShell>
  );
}
