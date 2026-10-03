import Link from "next/link";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { Icon } from "@/components/ui/icon";
import { ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from "@/types/activity";
import type { Activity } from "@/types/activity";

type ActivityCardProps = {
  activity: Activity;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <Link
      href={`/activities/${activity.id}`}
      className="group flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white gradient-brand"
        aria-hidden="true"
      >
        <Icon name={ACTIVITY_TYPE_ICONS[activity.type]} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-[var(--outly-ink)]">
            {activity.title}
          </h3>
          <span
            className={
              activity.status === "completed"
                ? "shrink-0 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-semibold text-[#1e7a3a]"
                : "shrink-0 rounded-full bg-[var(--outly-lavender)] px-2.5 py-1 text-xs font-semibold text-[var(--outly-purple-dark)]"
            }
          >
            {activity.status === "completed" ? "Completed" : "Upcoming"}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--outly-muted)]">
          <Icon name="pin" className="h-3.5 w-3.5" />
          {activity.location}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
          {ACTIVITY_TYPE_LABELS[activity.type]} · {formatDate(activity.startAt)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {activity.difficulty ? <DifficultyBadge difficulty={activity.difficulty} /> : null}
          <span className="text-xs text-[var(--outly-muted)]">
            {activity.participantCount} participant
            {activity.participantCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </Link>
  );
}
