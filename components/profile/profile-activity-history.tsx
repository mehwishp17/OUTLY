import { Icon } from "@/components/ui/icon";
import type { CompletedActivity, ActivityType } from "@/types/profile";

const TYPE_ICON: Record<ActivityType, "trail" | "calendar" | "compass" | "map"> = {
  hike: "trail",
  meetup: "calendar",
  trail: "compass",
  camp: "map",
};

const TYPE_LABEL: Record<ActivityType, string> = {
  hike: "Hike",
  meetup: "Meetup",
  trail: "Trail",
  camp: "Camp",
};

type ProfileActivityHistoryProps = {
  activities: CompletedActivity[];
};

/** Timeline of completed activities shown in the profile's "Activity
 * history" tab, or an inviting empty state for a new explorer. */
export function ProfileActivityHistory({ activities }: ProfileActivityHistoryProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-[var(--outly-muted)]">
        No completed activities yet. Explore experiences to start your journey.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {activities.map((activity) => (
        <li
          key={activity.id}
          className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-white p-4"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white gradient-brand"
            aria-hidden="true"
          >
            <Icon name={TYPE_ICON[activity.type]} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--outly-ink)]">{activity.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--outly-muted)]">
              <Icon name="pin" className="h-3.5 w-3.5" />
              {activity.location}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
              {TYPE_LABEL[activity.type]} · Completed {activity.completedOn}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
