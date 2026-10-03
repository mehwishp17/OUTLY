"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GamificationNav } from "@/components/gamification/gamification-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { fetchBadgeProgress } from "@/lib/api/gamification";
import type { BadgeProgress } from "@/lib/gamification";
import { formatRelativeTime } from "@/lib/utils";

/** Achievements: a timeline of the badges the current user has earned,
 * each dated by when the backend awarded it. */
export function AchievementsView() {
  const [progressList, setProgressList] = useState<BadgeProgress[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void fetchBadgeProgress().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setProgressList(result.data);
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

  const earned = progressList
    .filter((progress) => progress.earned)
    .sort((a, b) => new Date(b.earnedAt ?? 0).getTime() - new Date(a.earnedAt ?? 0).getTime());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Achievements
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          {earned.length === 0
            ? "A timeline of the badges you earn will appear here."
            : `${earned.length} badge${earned.length === 1 ? "" : "s"} earned so far, newest first.`}
        </p>
      </div>

      <GamificationNav active="achievements" />

      {status === "loading" ? (
        <LoadingState message="Loading your achievements…" />
      ) : status === "error" ? (
        <ErrorState title="We couldn't load your achievements" description={error} />
      ) : earned.length === 0 ? (
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
