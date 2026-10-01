"use client";

import { useRouter } from "next/navigation";
import { GroupComposer } from "@/components/groups/group-composer";
import { useGroupStore } from "@/context/group-store-context";

export function CreateGroupView() {
  const router = useRouter();
  const { createGroup } = useGroupStore();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <GroupComposer
        title="Create a group"
        description="Start a community around a shared outdoor interest."
        submitLabel="Create group"
        onCancel={() => router.push("/groups")}
        onSubmit={(values) => {
          const group = createGroup(values);
          router.push(`/groups/${group.id}`);
        }}
      />
    </div>
  );
}
