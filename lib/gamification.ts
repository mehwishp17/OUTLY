import type { IconName } from "@/components/ui/icon";
import type { Activity } from "@/types/activity";

/**
 * Gamification is computed entirely from real `Activity` data already
 * created in the Activities module — there is no separate, parallel
 * "gamification" mock dataset to keep in sync. Badge progress, earned
 * dates, and the leaderboard all derive from the same completed
 * activities and their real participants.
 */

export type BadgeMetric = "hikeCount" | "cyclingDistanceKm" | "campingCount" | "streakDays";

export type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  metric: BadgeMetric;
  target: number;
};

/** Matches the exact examples given in the Achievement & Gamification
 * requirements. */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-trek",
    title: "First Trek",
    description: "Complete your first hike.",
    icon: "trail",
    metric: "hikeCount",
    target: 1,
  },
  {
    id: "ten-mountains",
    title: "10 Mountains",
    description: "Complete 10 hikes.",
    icon: "trail",
    metric: "hikeCount",
    target: 10,
  },
  {
    id: "100km-cycling",
    title: "100 KM Cycling",
    description: "Cycle a cumulative 100 km across completed activities.",
    icon: "bike",
    metric: "cyclingDistanceKm",
    target: 100,
  },
  {
    id: "ten-camping-trips",
    title: "10 Camping Trips",
    description: "Complete 10 camping trips.",
    icon: "tent",
    metric: "campingCount",
    target: 10,
  },
  {
    id: "outdoor-streak",
    title: "30-Day Outdoor Streak",
    description: "Complete an activity on 30 different days within the last 30 days.",
    icon: "calendar",
    metric: "streakDays",
    target: 30,
  },
];

export type UserGamificationStats = {
  completedCount: number;
  totalDistanceKm: number;
  hikeCount: number;
  cyclingDistanceKm: number;
  campingCount: number;
  streakDays: number;
};

function completedActivitiesFor(userId: string, activities: Activity[]): Activity[] {
  return activities
    .filter((activity) => activity.status === "completed" && activity.participants.some((p) => p.id === userId))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

function distinctDaysWithinLast30(activities: Activity[]): number {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const days = new Set(
    activities
      .filter((activity) => new Date(activity.startAt).getTime() >= cutoff)
      .map((activity) => new Date(activity.startAt).toISOString().slice(0, 10)),
  );
  return days.size;
}

export function computeUserStats(userId: string, activities: Activity[]): UserGamificationStats {
  const completed = completedActivitiesFor(userId, activities);

  return {
    completedCount: completed.length,
    totalDistanceKm: completed.reduce((sum, activity) => sum + (activity.distanceKm ?? 0), 0),
    hikeCount: completed.filter((activity) => activity.type === "hike").length,
    cyclingDistanceKm: completed
      .filter((activity) => activity.type === "cycling")
      .reduce((sum, activity) => sum + (activity.distanceKm ?? 0), 0),
    campingCount: completed.filter((activity) => activity.type === "camping").length,
    streakDays: distinctDaysWithinLast30(completed),
  };
}

export type BadgeProgress = {
  badge: BadgeDefinition;
  value: number;
  earned: boolean;
  progressRatio: number;
  /** The real activity date the badge's target was first reached, if
   * earned — used by the Achievements timeline. Undefined for the
   * streak metric, which has no single crossing instant. */
  earnedAt?: string;
};

export function getBadgeProgress(
  userId: string,
  badge: BadgeDefinition,
  activities: Activity[],
): BadgeProgress {
  const stats = computeUserStats(userId, activities);
  const value = stats[badge.metric];
  const earned = value >= badge.target;

  let earnedAt: string | undefined;
  if (earned && badge.metric !== "streakDays") {
    const completed = completedActivitiesFor(userId, activities);
    if (badge.metric === "cyclingDistanceKm") {
      let running = 0;
      for (const activity of completed) {
        if (activity.type !== "cycling") continue;
        running += activity.distanceKm ?? 0;
        if (running >= badge.target) {
          earnedAt = activity.startAt;
          break;
        }
      }
    } else {
      const type = badge.metric === "hikeCount" ? "hike" : "camping";
      const qualifying = completed.filter((activity) => activity.type === type);
      earnedAt = qualifying[badge.target - 1]?.startAt;
    }
  }

  return {
    badge,
    value,
    earned,
    progressRatio: Math.min(1, badge.target === 0 ? 1 : value / badge.target),
    earnedAt,
  };
}

export function getAllBadgeProgress(userId: string, activities: Activity[]): BadgeProgress[] {
  return BADGE_DEFINITIONS.map((badge) => getBadgeProgress(userId, badge, activities));
}
