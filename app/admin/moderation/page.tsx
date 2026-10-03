import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { AppHeader } from "@/components/layout/app-header";
import { AdminModerationView } from "@/components/admin/admin-moderation-view";

export const metadata: Metadata = {
  title: "Admin moderation — OUTLY",
  description: "An audit log of every moderation action taken on the platform.",
};

export default function AdminModerationPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AdminAccessGate level="administrator">
        <AdminModerationView />
      </AdminAccessGate>
    </div>
  );
}
