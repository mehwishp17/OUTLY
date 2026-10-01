"use client";

import Link from "next/link";
import { ActivityCard } from "@/components/activities/activity-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { useActivityStore } from "@/context/activity-store-context";
import type { Activity } from "@/types/activity";

function sortByStartAtDesc(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
}

function ActivityGroup({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

/** Activity List: an "Upcoming" / "Completed" (Activity History) / "All"
 * tabbed view over every planned or completed activity. Combines the
 * Activity List and Activity History screens on one route since they're
 * the same underlying data, filtered differently. */
export function ActivityListView() {
  const { activities } = useActivityStore();
  const sorted = sortByStartAtDesc(activities);
  const upcoming = sorted.filter((activity) => activity.status === "planned");
  const completed = sorted.filter((activity) => activity.status === "completed");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Activities
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            Plan your next adventure or look back on where you&apos;ve been.
          </p>
        </div>
        <Button href="/activities/new" className="w-fit">
          <Icon name="plus" className="h-4 w-4" />
          Create activity
        </Button>
      </div>

      <Tabs
        ariaLabel="Activity filters"
        items={[
          { id: "upcoming", label: `Upcoming (${upcoming.length})`, content: <ActivityGroup activities={upcoming} /> },
          { id: "completed", label: `Completed (${completed.length})`, content: <ActivityGroup activities={completed} /> },
          { id: "all", label: "All", content: <ActivityGroup activities={sorted} /> },
        ]}
      />

      <p className="text-center text-xs text-[var(--outly-muted)]">
        Looking for trails and places to plan around? <Link href="/explore" className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]">Browse Explore</Link>.
      </p>
    </div>
  );
}
