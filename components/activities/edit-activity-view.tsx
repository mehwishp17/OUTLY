"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActivityComposer } from "@/components/activities/activity-composer";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { useActivityStore } from "@/context/activity-store-context";
import { useSocialStore } from "@/context/social-store-context";

type EditActivityViewProps = {
  activityId: string;
};

export function EditActivityView({ activityId }: EditActivityViewProps) {
  const router = useRouter();
  const { currentUser } = useSocialStore();
  const { getActivityById, editActivity, loadActivity } = useActivityStore();
  const activity = getActivityById(activityId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadActivity(activityId).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activityId, loadActivity]);

  if (!activity && loading) return <LoadingState message="Loading activity…" />;

  if (!activity || activity.creatorId !== currentUser.id) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">
          {activity ? "You can't edit this activity" : "Activity not found"}
        </h1>
        <p className="text-sm text-[var(--outly-muted)]">
          {activity
            ? "Only the organizer can edit an activity."
            : "This activity may have been removed, or the link is incorrect."}
        </p>
        <Link
          href="/activities"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to activities
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <ActivityComposer
        title="Edit activity"
        submitLabel="Save changes"
        initialValues={activity}
        onCancel={() => router.push(`/activities/${activity.id}`)}
        onSubmit={async (values) => {
          const error = await editActivity(activity.id, values);
          if (error) return error;
          router.push(`/activities/${activity.id}`);
          return undefined;
        }}
      />
    </div>
  );
}
