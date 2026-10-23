import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { CreatePartnerRequestView } from "@/components/partner/create-partner-request-view";

export const metadata: Metadata = {
  title: "Post a partner request — OUTLY",
  description: "Publish a request and let compatible explorers find you.",
};

export default function NewPartnerRequestPage() {
  return (
    <FeedPageShell>
      <CreatePartnerRequestView />
    </FeedPageShell>
  );
}
