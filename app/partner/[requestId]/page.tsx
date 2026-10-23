import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
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
    <FeedPageShell>
      <PartnerRequestDetailView requestId={requestId} />
    </FeedPageShell>
  );
}
