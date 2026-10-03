"use client";

import { useEffect } from "react";
import { GroupCard } from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { Tabs } from "@/components/ui/tabs";
import { useGroupStore } from "@/context/group-store-context";
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

/** Groups List: "My groups" / "Discover" tabs over every group the backend lists
 * for you (private groups are discoverable so you can ask to join). */
export function GroupListView() {
  const { groups, status, error, refresh } = useGroupStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const myGroups = groups.filter((group) => group.myRole);
  const discoverGroups = groups.filter((group) => !group.myRole);

  // Loading/error show inside the tabs, so the selected tab survives the data arriving.
  const notice =
    status === "loading" && groups.length === 0 ? (
        <LoadingState message="Loading groups…" />
    ) : status === "error" && groups.length === 0 ? (
        <ErrorState
          title="We couldn't load groups"
          description={error?.message}
          action={
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
    ) : null;

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
          { id: "mine", label: `My groups (${myGroups.length})`, content: notice ?? <GroupGrid groups={myGroups} /> },
          { id: "discover", label: "Discover", content: notice ?? <GroupGrid groups={discoverGroups} /> },
        ]}
      />
    </div>
  );
}
