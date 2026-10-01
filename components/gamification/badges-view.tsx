"use client";

import { BadgeCard } from "@/components/gamification/badge-card";
import { GamificationNav } from "@/components/gamification/gamification-nav";
import { useActivityStore } from "@/context/activity-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { getAllBadgeProgress } from "@/lib/gamification";

/** Badges: every badge definition, earned or in progress, computed live
 * from the current user's completed activities. */
export function BadgesView() {
  const { currentUser } = useSocialStore();
  const { activities } = useActivityStore();
  const badgeProgress = getAllBadgeProgress(currentUser.id, activities);
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

      <div className="grid gap-4 sm:grid-cols-2">
        {badgeProgress.map((progress) => (
          <BadgeCard key={progress.badge.id} progress={progress} />
        ))}
      </div>
    </div>
  );
}
