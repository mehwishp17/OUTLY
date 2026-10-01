import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { AdminPlacesView } from "@/components/admin/admin-places-view";

export const metadata: Metadata = {
  title: "Admin places — OUTLY",
  description: "Every place and trail listed on Explore.",
};

export default function AdminPlacesPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AdminPlacesView />
    </div>
  );
}
