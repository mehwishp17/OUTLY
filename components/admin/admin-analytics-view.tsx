"use client";

import { AdminNav } from "@/components/admin/admin-nav";
import { StatTile } from "@/components/admin/stat-tile";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useActivityStore } from "@/context/activity-store-context";
import { useAdminStore } from "@/context/admin-store-context";
import { useEventStore } from "@/context/event-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { ACTIVITY_TYPE_LABELS } from "@/types/activity";
import type { ActivityKind } from "@/types/activity";

type BreakdownRow = { label: string; count: number };

/**
 * Breakdown rows use one hue (the shared brand gradient) with length
 * encoding magnitude within the same list — identity is carried by the
 * text label, not by color, so this stays a single-hue "share of total"
 * view rather than a categorical chart needing per-series hues.
 */
function BreakdownList({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--outly-ink)]">{row.label}</span>
              <span className="text-[var(--outly-muted)]">{row.count}</span>
            </div>
            <ProgressBar value={row.count} max={max} label={`${row.count} ${row.label}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin Analytics: simple breakdowns computed from the same real store
 * data used across the app — no separate fabricated analytics dataset,
 * and no chart form is forced where a stat tile or a plain breakdown
 * list already answers the question clearly. */
export function AdminAnalyticsView() {
  const { posts } = useSocialStore();
  const { activities } = useActivityStore();
  const { events } = useEventStore();
  const { reports } = useAdminStore();

  const groupPosts = posts.filter((post) => post.groupId).length;
  const feedPosts = posts.length - groupPosts;
  const hiddenPosts = posts.filter((post) => post.hidden).length;

  const activityTypeRows: BreakdownRow[] = (Object.keys(ACTIVITY_TYPE_LABELS) as ActivityKind[]).map(
    (type) => ({
      label: ACTIVITY_TYPE_LABELS[type],
      count: activities.filter((activity) => activity.type === type).length,
    }),
  );

  const eventStatusRows: BreakdownRow[] = ["upcoming", "completed", "cancelled"].map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    count: events.filter((event) => event.status === status).length,
  }));

  const reportStatusRows: BreakdownRow[] = ["open", "actioned", "dismissed"].map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    count: reports.filter((report) => report.status === status).length,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          A snapshot of platform activity across content, activities, and events.
        </p>
      </div>

      <AdminNav active="/admin/analytics" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Home Feed posts" value={feedPosts} icon="message-circle" />
        <StatTile label="Group posts" value={groupPosts} icon="tent" />
        <StatTile label="Hidden posts" value={hiddenPosts} icon="shield-check" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <BreakdownList title="Activities by type" rows={activityTypeRows} />
        <BreakdownList title="Events by status" rows={eventStatusRows} />
        <BreakdownList title="Reports by status" rows={reportStatusRows} />
      </div>
    </div>
  );
}
