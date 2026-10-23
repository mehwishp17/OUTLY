import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AdminContentView } from "@/components/admin/admin-content-view";

export const metadata: Metadata = {
  title: "Admin content — OUTLY",
  description: "Every post across the Home Feed and Group Feeds.",
};

export default function AdminContentPage() {
  return (
    <FeedPageShell>
      <AdminAccessGate level="moderator">
        <AdminContentView />
      </AdminAccessGate>
    </FeedPageShell>
  );
}
