import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EditPartnerRequestView } from "@/components/partner/edit-partner-request-view";

export const metadata: Metadata = {
  title: "Edit partner request — OUTLY",
  description: "Edit your OUTLY adventure partner request.",
};

type EditPartnerRequestPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function EditPartnerRequestPage({ params }: EditPartnerRequestPageProps) {
  const { requestId } = await params;

  return (
    <FeedPageShell>
      <EditPartnerRequestView requestId={requestId} />
    </FeedPageShell>
  );
}
