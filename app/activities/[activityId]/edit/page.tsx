import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EditActivityView } from "@/components/activities/edit-activity-view";

export const metadata: Metadata = {
  title: "Edit activity — OUTLY",
  description: "Edit your OUTLY activity.",
};

type EditActivityPageProps = {
  params: Promise<{ activityId: string }>;
};

export default async function EditActivityPage({ params }: EditActivityPageProps) {
  const { activityId } = await params;

  return (
    <FeedPageShell>
      <EditActivityView activityId={activityId} />
    </FeedPageShell>
  );
}
