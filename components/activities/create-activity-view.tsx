"use client";

import { useRouter } from "next/navigation";
import { ActivityComposer } from "@/components/activities/activity-composer";
import { useActivityStore } from "@/context/activity-store-context";

export function CreateActivityView() {
  const router = useRouter();
  const { createActivity } = useActivityStore();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <ActivityComposer
        title="Create an activity"
        description="Plan a hike, ride, or camping trip — and invite people to join."
        submitLabel="Create activity"
        onCancel={() => router.push("/activities")}
        onSubmit={async (values) => {
          const { activity, error } = await createActivity(values);
          if (error || !activity) return error;
          router.push(`/activities/${activity.id}`);
          return undefined;
        }}
      />
    </div>
  );
}
