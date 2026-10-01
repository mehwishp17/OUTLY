import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { AdminContentView } from "@/components/admin/admin-content-view";

export const metadata: Metadata = {
  title: "Admin content — OUTLY",
  description: "Every post across the Home Feed and Group Feeds.",
};

export default function AdminContentPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AdminContentView />
    </div>
  );
}
