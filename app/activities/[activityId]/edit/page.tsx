import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <EditActivityView activityId={activityId} />
    </div>
  );
}
