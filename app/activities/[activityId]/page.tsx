import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ActivityDetailView activityId={activityId} />
    </div>
  );
}
