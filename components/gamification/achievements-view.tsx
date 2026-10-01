"use client";

import Link from "next/link";
import { GamificationNav } from "@/components/gamification/gamification-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { useActivityStore } from "@/context/activity-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { getAllBadgeProgress } from "@/lib/gamification";
import { formatRelativeTime } from "@/lib/utils";

/** Achievements: a chronological timeline of badges the current user has
 * actually earned, each dated by the real activity that crossed its
 * threshold (see `lib/gamification.ts`) — not a separate fabricated
 * event log. */
export function AchievementsView() {
  const { currentUser } = useSocialStore();
  const { activities } = useActivityStore();
  const earned = getAllBadgeProgress(currentUser.id, activities)
    .filter((progress) => progress.earned)
    .sort((a, b) => new Date(b.earnedAt ?? 0).getTime() - new Date(a.earnedAt ?? 0).getTime());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Achievements
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          A timeline of the badges you&apos;ve earned so far.
        </p>
      </div>

      <GamificationNav active="achievements" />

      {earned.length === 0 ? (
        <EmptyState
          icon="trophy"
          title="No achievements yet"
          description="Complete activities to start earning badges — check your progress on the Badges tab."
          action={
            <Link
              href="/badges"
              className="text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
            >
              View badges
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {earned.map((progress) => (
            <li
              key={progress.badge.id}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)]"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white gradient-brand"
                aria-hidden="true"
              >
                <Icon name={progress.badge.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--outly-ink)]">{progress.badge.title}</p>
                <p className="text-xs text-[var(--outly-muted)]">{progress.badge.description}</p>
              </div>
              {progress.earnedAt ? (
                <span className="shrink-0 text-xs text-[var(--outly-muted)]">
                  {formatRelativeTime(progress.earnedAt)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
