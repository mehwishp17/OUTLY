import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AdminModerationView } from "@/components/admin/admin-moderation-view";

export const metadata: Metadata = {
  title: "Admin moderation — OUTLY",
  description: "An audit log of every moderation action taken on the platform.",
};

export default function AdminModerationPage() {
  return (
    <FeedPageShell>
      <AdminAccessGate level="administrator">
        <AdminModerationView />
      </AdminAccessGate>
    </FeedPageShell>
  );
}
