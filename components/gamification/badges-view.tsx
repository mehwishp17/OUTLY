"use client";

import { useEffect, useState } from "react";
import { BadgeCard } from "@/components/gamification/badge-card";
import { GamificationNav } from "@/components/gamification/gamification-nav";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { fetchBadgeProgress } from "@/lib/api/gamification";
import type { BadgeProgress } from "@/lib/gamification";

/** Badges: every badge, earned or in progress. The backend works out the
 * progress and awards badges automatically as activities, posts, follows
 * and so on happen. */
export function BadgesView() {
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void fetchBadgeProgress().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setBadgeProgress(result.data);
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

  const earnedCount = badgeProgress.filter((progress) => progress.earned).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Badges
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          {earnedCount} of {badgeProgress.length} earned — awarded for completed activities,
          distance, and consistency.
        </p>
      </div>

      <GamificationNav active="badges" />

      {status === "loading" ? <LoadingState message="Loading badges…" /> : null}
      {status === "error" ? <ErrorState title="We couldn't load your badges" description={error} /> : null}

      {[
        { title: "Earned", items: badgeProgress.filter((progress) => progress.earned) },
        { title: "In progress", items: badgeProgress.filter((progress) => !progress.earned) },
      ]
        .filter((group) => status === "ready" && group.items.length > 0)
        .map((group) => (
          <section key={group.title} aria-labelledby={`badges-${group.title}`} className="flex flex-col gap-3">
            <h2
              id={`badges-${group.title}`}
              className="text-xs font-semibold uppercase tracking-wider text-[var(--outly-muted)]"
            >
              {group.title} · {group.items.length}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.items.map((progress) => (
                <BadgeCard key={progress.badge.id} progress={progress} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
