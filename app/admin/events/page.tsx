import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { AppHeader } from "@/components/layout/app-header";
import { AdminEventsView } from "@/components/admin/admin-events-view";

export const metadata: Metadata = {
  title: "Admin events — OUTLY",
  description: "Every event on the platform.",
};

export default function AdminEventsPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AdminAccessGate level="moderator">
        <AdminEventsView />
      </AdminAccessGate>
    </div>
  );
}
