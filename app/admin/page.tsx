import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export const metadata: Metadata = {
  title: "Admin dashboard — OUTLY",
  description: "A platform-wide overview across users, content, places, and events.",
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AdminDashboardView />
    </div>
  );
}
