import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <GroupDetailView groupId={groupId} />
    </div>
  );
}
