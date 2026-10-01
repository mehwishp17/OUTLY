import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { PartnerRequestDetailView } from "@/components/partner/partner-request-detail-view";

export const metadata: Metadata = {
  title: "Partner request — OUTLY",
  description: "View this adventure partner request.",
};

type PartnerRequestDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function PartnerRequestDetailPage({ params }: PartnerRequestDetailPageProps) {
  const { requestId } = await params;

  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <PartnerRequestDetailView requestId={requestId} />
    </div>
  );
}
