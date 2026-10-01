"use client";

import { AdminNav } from "@/components/admin/admin-nav";
import { StatTile } from "@/components/admin/stat-tile";
import { Alert } from "@/components/ui/alert";
import { useActivityStore } from "@/context/activity-store-context";
import { useAdminStore } from "@/context/admin-store-context";
import { useEventStore } from "@/context/event-store-context";
import { useGroupStore } from "@/context/group-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { MOCK_PLACES } from "@/lib/mock/mock-places";
import { MOCK_OTHER_USERS } from "@/lib/mock/mock-users";

/** Admin Dashboard: platform-wide counts pulled from the real stores
 * behind every other module (Feed, Explore, Activities, Events, Groups)
 * rather than a separate fabricated analytics dataset. */
export function AdminDashboardView() {
  const { posts } = useSocialStore();
  const { activities } = useActivityStore();
  const { events } = useEventStore();
  const { groups } = useGroupStore();
  const { reports, suspendedUserIds } = useAdminStore();

  const openReports = reports.filter((report) => report.status === "open").length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          A platform-wide overview across users, content, places, and events.
        </p>
      </div>

      <Alert variant="info" title="This is a frontend-only demo admin panel">
        Every action here updates local session state only. In production, every one of these
        actions must also be enforced by the backend — a hidden button here is never real
        authorization.
      </Alert>

      <AdminNav active="/admin" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Users" value={1 + MOCK_OTHER_USERS.length} icon="search" href="/admin/users" />
        <StatTile label="Posts" value={posts.length} icon="message-circle" href="/admin/content" />
        <StatTile label="Places & trails" value={MOCK_PLACES.length} icon="map" href="/admin/places" />
        <StatTile label="Events" value={events.length} icon="tent" href="/admin/events" />
        <StatTile label="Groups" value={groups.length} icon="compass" />
        <StatTile label="Activities" value={activities.length} icon="calendar" />
        <StatTile label="Open reports" value={openReports} icon="alert-circle" href="/admin/reports" />
        <StatTile label="Suspended users" value={suspendedUserIds.length} icon="shield-check" href="/admin/users" />
      </div>
    </div>
  );
}
