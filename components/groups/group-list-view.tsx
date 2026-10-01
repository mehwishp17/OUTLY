"use client";

import { GroupCard } from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { useGroupStore } from "@/context/group-store-context";
import { useSocialStore } from "@/context/social-store-context";
import type { Group } from "@/types/group";

function GroupGrid({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

/** Groups List: "My groups" / "Discover" tabs over every group. */
export function GroupListView() {
  const { currentUser } = useSocialStore();
  const { groups } = useGroupStore();
  const myGroups = groups.filter((group) => group.members.some((m) => m.id === currentUser.id));
  const discoverGroups = groups.filter(
    (group) => !group.members.some((m) => m.id === currentUser.id) && group.visibility === "public",
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Groups &amp; Communities
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            Local trekking clubs, cycling communities, and weekend camping groups.
          </p>
        </div>
        <Button href="/groups/new" className="w-fit">
          <Icon name="plus" className="h-4 w-4" />
          Create group
        </Button>
      </div>

      <Tabs
        ariaLabel="Group filters"
        items={[
          { id: "mine", label: `My groups (${myGroups.length})`, content: <GroupGrid groups={myGroups} /> },
          { id: "discover", label: "Discover", content: <GroupGrid groups={discoverGroups} /> },
        ]}
      />
    </div>
  );
}
