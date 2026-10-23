"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ActivitiesSidebar } from "@/components/activities/activities-sidebar";
import { ActivityCard } from "@/components/activities/activity-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { useActivityStore } from "@/context/activity-store-context";
import type { Activity } from "@/types/activity";

function sortByStartAtDesc(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
}

/** Placeholder cards while the activities load (the status text is for screen readers). */
function ActivitiesSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-5">
      <span className="sr-only">Loading activities…</span>
      {[0, 1].map((key) => (
        <div
          key={key}
          aria-hidden="true"
          className="animate-pulse overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] motion-reduce:animate-none"
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-11 w-11 rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded-full bg-white/10" />
              <div className="h-2.5 w-20 rounded-full bg-white/[0.07]" />
            </div>
          </div>
          <div className="aspect-[16/7] bg-white/[0.06]" />
          <div className="space-y-3 px-5 py-4">
            <div className="h-4 w-2/3 rounded-full bg-white/10" />
            <div className="h-3 w-1/2 rounded-full bg-white/[0.07]" />
          </div>
        </div>
      ))}
    </div>
  );
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
    <div className="flex flex-col gap-5">
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
  const { activities, status, error, refresh } = useActivityStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sorted = sortByStartAtDesc(activities);
  const upcoming = sorted.filter((activity) => activity.status === "planned");
  const completed = sorted.filter((activity) => activity.status === "completed");

  // Loading/error show inside the tabs, so the selected tab survives the data arriving.
  const notice =
    status === "loading" && activities.length === 0 ? (
        <ActivitiesSkeleton />
    ) : status === "error" && activities.length === 0 ? (
        <ErrorState
          title="We couldn't load activities"
          description={error?.message}
          action={
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
    ) : null;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,36rem)_19rem] lg:justify-center lg:py-10">
      <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Activities
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            Plan your next adventure or look back on where you&apos;ve been.
          </p>
        </div>
        <Button href="/activities/new" className="w-fit shrink-0 whitespace-nowrap">
          <Icon name="plus" className="h-4 w-4" />
          Create activity
        </Button>
      </div>

      <Tabs
        ariaLabel="Activity filters"
        items={[
          { id: "upcoming", label: `Upcoming (${upcoming.length})`, content: notice ?? <ActivityGroup activities={upcoming} /> },
          { id: "completed", label: `Completed (${completed.length})`, content: notice ?? <ActivityGroup activities={completed} /> },
          { id: "all", label: "All", content: notice ?? <ActivityGroup activities={sorted} /> },
        ]}
      />

      <p className="text-center text-xs text-[var(--outly-muted)]">
        Looking for trails and places to plan around? <Link href="/explore" className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]">Browse Explore</Link>.
      </p>
      </div>

      <ActivitiesSidebar activities={activities} />
    </div>
  );
}
