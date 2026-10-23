import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { GroupDetailView } from "@/components/groups/group-detail-view";

export const metadata: Metadata = {
  title: "Group — OUTLY",
  description: "View this group's feed, members, and rules.",
};

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupId } = await params;

  return (
    <FeedPageShell>
      <GroupDetailView groupId={groupId} />
    </FeedPageShell>
  );
}
