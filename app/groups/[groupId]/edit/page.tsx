import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <EditGroupView groupId={groupId} />
    </div>
  );
}
