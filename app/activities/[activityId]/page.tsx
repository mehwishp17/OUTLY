import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { ActivityDetailView } from "@/components/activities/activity-detail-view";

export const metadata: Metadata = {
  title: "Activity — OUTLY",
  description: "View activity details and participants.",
};

type ActivityDetailPageProps = {
  params: Promise<{ activityId: string }>;
};

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { activityId } = await params;

  return (
    <FeedPageShell>
      <ActivityDetailView activityId={activityId} />
    </FeedPageShell>
  );
}
