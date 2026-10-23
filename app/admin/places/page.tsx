import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AdminPlacesView } from "@/components/admin/admin-places-view";

export const metadata: Metadata = {
  title: "Admin places — OUTLY",
  description: "Every place and trail listed on Explore.",
};

export default function AdminPlacesPage() {
  return (
    <FeedPageShell>
      <AdminAccessGate level="administrator">
        <AdminPlacesView />
      </AdminAccessGate>
    </FeedPageShell>
  );
}
