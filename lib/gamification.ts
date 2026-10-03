import type { IconName } from "@/components/ui/icon";

/**
 * Badge and progress types for the Gamification screens. Badges, progress
 * and the leaderboard are computed by the OUTLY backend (the backend owns
 * the rules and awards badges automatically); `lib/api/gamification.ts`
 * loads them.
 */

export type BadgeDefinition = {
  /** The badge's stable code (e.g. "first-trek"). */
  id: string;
  title: string;
  description: string;
  icon: IconName;
  target: number;
};

export type BadgeProgress = {
  badge: BadgeDefinition;
  /** Progress towards the target (capped at the target). */
  value: number;
  earned: boolean;
  progressRatio: number;
  /** When the badge was awarded, if it was. */
  earnedAt?: string;
};
