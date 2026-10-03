"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GroupComposer } from "@/components/groups/group-composer";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { useGroupStore } from "@/context/group-store-context";

type EditGroupViewProps = {
  groupId: string;
};

export function EditGroupView({ groupId }: EditGroupViewProps) {
  const router = useRouter();
  const { getGroupById, editGroup, loadGroup } = useGroupStore();
  const group = getGroupById(groupId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadGroup(groupId).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, loadGroup]);

  if (!group && loading) return <LoadingState message="Loading group…" />;

  if (!group || group.myRole !== "owner") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">
          {group ? "You can't edit this group" : "Group not found"}
        </h1>
        <p className="text-sm text-[var(--outly-muted)]">
          {group
            ? "Only the group owner can edit its settings."
            : "This group may have been removed, or the link is incorrect."}
        </p>
        <Link
          href="/groups"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to groups
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <GroupComposer
        title="Edit group"
        submitLabel="Save changes"
        initialValues={group}
        onCancel={() => router.push(`/groups/${group.id}`)}
        onSubmit={async (values) => {
          const error = await editGroup(group.id, values);
          if (error) return error;
          router.push(`/groups/${group.id}`);
          return undefined;
        }}
      />
    </div>
  );
}
