import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EditGroupView } from "@/components/groups/edit-group-view";

export const metadata: Metadata = {
  title: "Edit group — OUTLY",
  description: "Edit your OUTLY group settings.",
};

type EditGroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const { groupId } = await params;

  return (
    <FeedPageShell>
      <EditGroupView groupId={groupId} />
    </FeedPageShell>
  );
}
