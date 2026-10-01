import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <EditPartnerRequestView requestId={requestId} />
    </div>
  );
}
