"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GamificationNav } from "@/components/gamification/gamification-nav";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useSocialStore } from "@/context/social-store-context";
import { fetchLeaderboard } from "@/lib/api/gamification";
import type { LeaderboardEntry } from "@/lib/api/gamification";
import { resolveUserSummary } from "@/lib/user-directory";
import { cn } from "@/lib/utils";

const RANK_MEDAL_CLASSES = ["bg-[#f6c85f] text-[#5b3a00]", "bg-[#d8d8e0] text-[#3d3d47]", "bg-[#d99a63] text-[#4a2c0f]"];

/** Leaderboard: ranks members by total distance across completed
 * activities, computed by the backend (members with a private profile are
 * left off). You are always listed, even before your first activity. */
export function LeaderboardView() {
  const { currentUser } = useSocialStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void fetchLeaderboard().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setEntries(result.data);
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

  const ranked = entries
    .map((entry) => {
      const user = resolveUserSummary(entry.userId, currentUser);
      return user ? { user, stats: { completedCount: entry.completedCount, totalDistanceKm: entry.distanceKm } } : undefined;
    })
    .filter((entry) => entry !== undefined);
  if (status === "ready" && currentUser.id && !ranked.some((entry) => entry.user.isCurrentUser)) {
    const me = resolveUserSummary(currentUser.id, currentUser);
    if (me) ranked.push({ user: me, stats: { completedCount: 0, totalDistanceKm: 0 } });
  }

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

      {status === "loading" ? (
        <LoadingState message="Loading the leaderboard…" />
      ) : status === "error" ? (
        <ErrorState title="We couldn't load the leaderboard" description={error} />
      ) : ranked.length === 0 ? (
        <EmptyState icon="trophy" title="No rankings yet" description="Complete an activity to get on the board." />
      ) : null}

      <ol className="flex flex-col gap-2">
        {ranked.map(({ user, stats }, index) => (
          <li key={user.id}>
            <Link
              href={user.isCurrentUser ? "/profile" : `/people/${user.id}`}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-lg)] border bg-white p-4 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                user.isCurrentUser ? "border-[var(--outly-violet)]/40 bg-[var(--outly-lavender)]/60" : "border-[var(--outly-border)]",
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
