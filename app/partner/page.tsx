import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { PartnerListView } from "@/components/partner/partner-list-view";

export const metadata: Metadata = {
  title: "Adventure Partners — OUTLY",
  description: "Find compatible partners for your next trek, ride, or trip.",
};

export default function PartnerPage() {
  return (
    <FeedPageShell>
      <PartnerListView />
    </FeedPageShell>
  );
}
