import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { AdminReportsView } from "@/components/admin/admin-reports-view";

export const metadata: Metadata = {
  title: "Admin reports — OUTLY",
  description: "Reports filed by the community against posts and accounts.",
};

export default function AdminReportsPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AdminReportsView />
    </div>
  );
}
