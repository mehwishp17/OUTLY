"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { fetchAuditLog } from "@/lib/api/admin";
import { formatRelativeTime } from "@/lib/utils";
import type { ModerationLogEntry } from "@/types/report";

/** Icon for an audit entry: removals/suspensions look different from approvals and dismissals. */
function iconFor(action: string): "close" | "check-circle" | "shield-check" {
  if (/(hide|delete|suspend|restrict|rejected)/.test(action)) return "close";
  if (/(no_action|approved)/.test(action)) return "check-circle";
  return "shield-check";
}

/** Admin Moderation (administrators): the audit log of every privileged
 * action taken on the platform (resolving reports, hiding content,
 * suspending users, verifying places, approving events and organizers),
 * written by the backend at the moment each action happens. */
export function AdminModerationView() {
  const [moderationLog, setModerationLog] = useState<ModerationLogEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void fetchAuditLog().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setModerationLog(result.data);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...moderationLog].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Moderation
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          An audit log of every moderation action taken on the platform.
        </p>
      </div>

      <AdminNav active="/admin/moderation" />

      {status === "loading" ? (
        <LoadingState message="Loading the audit log…" />
      ) : status === "error" ? (
        <ErrorState title="We couldn't load the audit log" description={error} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="shield-check"
          title="No moderation actions yet"
          description="Actions taken from Users, Content, Reports, Places, and Events will appear here."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]"
                aria-hidden="true"
              >
                <Icon name={iconFor(entry.action)} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--outly-ink)]">
                  {entry.label}
                </p>
                <p className="truncate text-sm text-[var(--outly-muted)]">
                  {entry.targetLabel ? `${entry.targetLabel} · ` : ""}by {entry.actorName}
                </p>
                {entry.note ? (
                  <p className="mt-1 text-xs text-[var(--outly-muted)]">{entry.note}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-[var(--outly-muted)]">
                {formatRelativeTime(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
