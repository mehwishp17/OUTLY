"use client";

import Link from "next/link";
import { GamificationNav } from "@/components/gamification/gamification-nav";
import { Avatar } from "@/components/ui/avatar";
import { useActivityStore } from "@/context/activity-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { computeUserStats } from "@/lib/gamification";
import { MOCK_OTHER_USERS } from "@/lib/mock/mock-users";
import { resolveUserSummary } from "@/lib/user-directory";
import { cn } from "@/lib/utils";

const RANK_MEDAL_CLASSES = ["bg-[#f6c85f] text-[#5b3a00]", "bg-[#d8d8e0] text-[#3d3d47]", "bg-[#d99a63] text-[#4a2c0f]"];

/** Leaderboard: ranks every known user by total distance across
 * completed activities — computed from the same real `Activity` data as
 * Badges/Achievements, not a separate fabricated ranking. */
export function LeaderboardView() {
  const { currentUser } = useSocialStore();
  const { activities } = useActivityStore();

  const ranked = [currentUser.id, ...MOCK_OTHER_USERS.map((user) => user.id)]
    .map((userId) => {
      const user = resolveUserSummary(userId, currentUser);
      const stats = computeUserStats(userId, activities);
      return user ? { user, stats } : undefined;
    })
    .filter((entry) => entry !== undefined)
    .sort(
      (a, b) =>
        b.stats.totalDistanceKm - a.stats.totalDistanceKm || b.stats.completedCount - a.stats.completedCount,
    );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Ranked by total distance covered across completed activities.
        </p>
      </div>

      <GamificationNav active="leaderboard" />

      <ol className="flex flex-col gap-2">
        {ranked.map(({ user, stats }, index) => (
          <li key={user.id}>
            <Link
              href={user.isCurrentUser ? "/profile" : `/people/${user.id}`}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-lg)] border bg-white p-4 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                user.isCurrentUser ? "border-[var(--outly-violet)]/40" : "border-[var(--outly-border)]",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  index < 3 ? RANK_MEDAL_CLASSES[index] : "bg-[var(--outly-lavender)] text-[var(--outly-muted)]",
                )}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--outly-ink)]">
                  {user.name}
                  {user.isCurrentUser ? (
                    <span className="ml-1.5 text-xs font-normal text-[var(--outly-muted)]">(You)</span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--outly-muted)]">
                  {stats.completedCount} completed activit{stats.completedCount === 1 ? "y" : "ies"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-[var(--outly-purple-dark)]">
                {stats.totalDistanceKm} km
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
