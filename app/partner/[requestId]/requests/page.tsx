import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { PartnerJoinRequestsView } from "@/components/partner/partner-join-requests-view";

export const metadata: Metadata = {
  title: "Join requests — OUTLY",
  description: "Review and respond to people asking to join your partner request.",
};

type PartnerJoinRequestsPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function PartnerJoinRequestsPage({ params }: PartnerJoinRequestsPageProps) {
  const { requestId } = await params;

  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <PartnerJoinRequestsView requestId={requestId} />
    </div>
  );
}
