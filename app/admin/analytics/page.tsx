import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { AppHeader } from "@/components/layout/app-header";
import { AdminAnalyticsView } from "@/components/admin/admin-analytics-view";

export const metadata: Metadata = {
  title: "Admin analytics — OUTLY",
  description: "A snapshot of platform activity across content, activities, and events.",
};

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AdminAccessGate level="administrator">
        <AdminAnalyticsView />
      </AdminAccessGate>
    </div>
  );
}
