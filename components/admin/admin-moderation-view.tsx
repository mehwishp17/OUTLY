"use client";

import { AdminNav } from "@/components/admin/admin-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { useAdminStore } from "@/context/admin-store-context";
import { formatRelativeTime } from "@/lib/utils";
import { MODERATION_ACTION_LABELS } from "@/types/report";
import type { ModerationActionType } from "@/types/report";

const ACTION_ICON: Record<ModerationActionType, "close" | "check-circle" | "shield-check"> = {
  post_hidden: "close",
  post_unhidden: "check-circle",
  user_suspended: "close",
  user_reinstated: "check-circle",
  report_dismissed: "check-circle",
  report_actioned: "shield-check",
  place_verified: "shield-check",
  place_unverified: "close",
  event_cancelled: "close",
};

/** Admin Moderation: an audit log of every moderation action taken
 * across the platform (resolving reports, hiding content, suspending
 * users, verifying places, cancelling events) — appended to in real time
 * by every other Admin screen via `useAdminStore().logAction`. */
export function AdminModerationView() {
  const { moderationLog } = useAdminStore();
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

      {sorted.length === 0 ? (
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
                <Icon name={ACTION_ICON[entry.action]} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--outly-ink)]">
                  {MODERATION_ACTION_LABELS[entry.action]}
                </p>
                <p className="truncate text-sm text-[var(--outly-muted)]">{entry.targetLabel}</p>
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
