import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { AppHeader } from "@/components/layout/app-header";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export const metadata: Metadata = {
  title: "Admin users — OUTLY",
  description: "Manage account status across the platform.",
};

export default function AdminUsersPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AdminAccessGate level="administrator">
        <AdminUsersView />
      </AdminAccessGate>
    </div>
  );
}
