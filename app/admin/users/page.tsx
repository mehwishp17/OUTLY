import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export const metadata: Metadata = {
  title: "Admin users — OUTLY",
  description: "Manage account status across the platform.",
};

export default function AdminUsersPage() {
  return (
    <FeedPageShell>
      <AdminAccessGate level="administrator">
        <AdminUsersView />
      </AdminAccessGate>
    </FeedPageShell>
  );
}
