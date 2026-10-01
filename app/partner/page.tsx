import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { PartnerListView } from "@/components/partner/partner-list-view";

export const metadata: Metadata = {
  title: "Adventure Partners — OUTLY",
  description: "Find compatible partners for your next trek, ride, or trip.",
};

export default function PartnerPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <PartnerListView />
    </div>
  );
}
