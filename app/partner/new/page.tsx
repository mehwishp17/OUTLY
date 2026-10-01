import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { CreatePartnerRequestView } from "@/components/partner/create-partner-request-view";

export const metadata: Metadata = {
  title: "Post a partner request — OUTLY",
  description: "Publish a request and let compatible explorers find you.",
};

export default function NewPartnerRequestPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <CreatePartnerRequestView />
    </div>
  );
}
