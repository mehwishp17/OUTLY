"use client";

import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAdminStore } from "@/context/admin-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { resolveUserSummary } from "@/lib/user-directory";
import { formatRelativeTime } from "@/lib/utils";
import { REPORT_REASON_LABELS } from "@/types/report";
import type { Report } from "@/types/report";

const STATUS_CLASSES: Record<Report["status"], string> = {
  open: "bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]",
  actioned: "bg-[#e6f4ea] text-[#1e7a3a]",
  dismissed: "bg-[var(--outly-lavender)]/60 text-[var(--outly-muted)]",
};

/** Admin Reports: every report filed through "Report post" (Feed) or
 * "Report user" (Public Profile), with Dismiss / Take action controls
 * for open reports. Resolving a report also writes an entry to the
 * Moderation audit log. */
export function AdminReportsView() {
  const { currentUser } = useSocialStore();
  const { reports, resolveReport } = useAdminStore();

  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Reports
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Reports filed by the community against posts and accounts.
        </p>
      </div>

      <AdminNav active="/admin/reports" />

      {sorted.length === 0 ? (
        <EmptyState icon="shield-check" title="No reports" description="Nothing has been reported." />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((report) => {
            const reporter = resolveUserSummary(report.reporterId, currentUser);
            const targetHref =
              report.targetType === "post" ? `/feed/${report.targetId}` : `/people/${report.targetId}`;

            return (
              <li
                key={report.id}
                className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[report.status]}`}>
                      {report.status === "open" ? "Open" : report.status === "actioned" ? "Actioned" : "Dismissed"}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-violet)]">
                      {REPORT_REASON_LABELS[report.reason]}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--outly-muted)]">
                    {formatRelativeTime(report.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-[var(--outly-ink)]">
                  {report.targetType === "post" ? "Post" : "User"}:{" "}
                  <Link href={targetHref} className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]">
                    {report.targetLabel}
                  </Link>
                </p>
                <p className="mt-1 text-xs text-[var(--outly-muted)]">
                  Reported by {reporter?.name ?? "a deleted account"}
                </p>
                {report.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">{report.description}</p>
                ) : null}

                {report.status === "open" ? (
                  <div className="mt-3 flex gap-2">
                    <Button size="md" onClick={() => resolveReport(report.id, "actioned")}>
                      Take action
                    </Button>
                    <Button size="md" variant="secondary" onClick={() => resolveReport(report.id, "dismissed")}>
                      Dismiss
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
