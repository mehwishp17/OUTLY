"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { StatTile } from "@/components/admin/stat-tile";
import { Alert } from "@/components/ui/alert";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { fetchOverview } from "@/lib/api/admin";
import type { Overview } from "@/lib/api/admin";

/** Admin Dashboard: platform-wide counts computed by the backend
 * (cached for a minute, so the dashboard never runs heavy queries on every visit). */
export function AdminDashboardView() {
  const [overview, setOverview] = useState<Overview>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void fetchOverview().then((result) => {
      if (cancelled) return;
      if (result.ok) setOverview(result.data);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const byStatus = overview?.moderation.reports_by_status ?? {};
  const openReports = (byStatus.OPEN ?? 0) + (byStatus.IN_REVIEW ?? 0);

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

      <Alert variant="info" title="Staff tools">
        Every action here is checked and recorded by the backend, which only allows it for accounts
        with the right role.
      </Alert>

      <AdminNav active="/admin" />

      {error ? (
        <ErrorState title="We couldn't load the dashboard" description={error} />
      ) : !overview ? (
        <LoadingState message="Loading the dashboard…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Users" value={overview.users.total} icon="search" href="/admin/users" />
          <StatTile label="Posts" value={overview.posts.total} icon="message-circle" href="/admin/content" />
          <StatTile
            label="Places & trails"
            value={(overview.content?.places ?? 0) + (overview.content?.trails ?? 0)}
            icon="map"
            href="/admin/places"
          />
          <StatTile label="Events" value={overview.events.total} icon="tent" href="/admin/events" />
          <StatTile label="Groups" value={overview.groups.total} icon="compass" />
          <StatTile label="Activities" value={overview.activities.total} icon="calendar" />
          <StatTile label="Open reports" value={openReports} icon="alert-circle" href="/admin/reports" />
          <StatTile label="Suspended users" value={overview.users.suspended} icon="shield-check" href="/admin/users" />
        </div>
      )}
    </div>
  );
}
