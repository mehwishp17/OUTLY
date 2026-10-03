import { callBackend } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";
import type { BadgeProgress } from "@/lib/gamification";
import type { IconName } from "@/components/ui/icon";

/**
 * Gamification client (`/api/backend/...`):
 *   GET badges/                       every badge with my progress
 *   GET leaderboard/?metric=&period=  ranking (public profiles only)
 */

type BackendBadge = {
  code: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  current: number;
  percent: number;
  earned: boolean;
  awarded_at?: string | null;
};

const ICONS = new Set<string>([
  "trail", "map", "calendar", "compass", "pin", "heart", "heart-filled", "message-circle", "users",
  "tent", "bike", "paw", "star", "star-filled", "shield-check", "trophy",
]);
const toIcon = (name: string): IconName => (ICONS.has(name) ? (name as IconName) : "trophy");

export async function fetchBadgeProgress(): Promise<ApiResult<BadgeProgress[]>> {
  const result = await callBackend<BackendBadge[]>("GET", "badges");
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data.map((raw) => ({
      badge: { id: raw.code, title: raw.name, description: raw.description, icon: toIcon(raw.icon), target: raw.threshold },
      value: raw.current,
      earned: raw.earned,
      progressRatio: Math.min(1, raw.percent / 100),
      earnedAt: raw.awarded_at || undefined,
    })),
  };
}

type BackendRow = {
  user_id: number;
  username: string;
  display_name?: string;
  photo?: string | null;
  score: number;
  rank: number;
};

export type LeaderboardEntry = {
  userId: string;
  rank: number;
  distanceKm: number;
  completedCount: number;
};

/** Everyone with at least one completed activity, ranked by total distance. */
export async function fetchLeaderboard(): Promise<ApiResult<LeaderboardEntry[]>> {
  const [distance, counts] = await Promise.all([
    callBackend<BackendRow[]>("GET", "leaderboard?metric=distance&limit=100"),
    callBackend<BackendRow[]>("GET", "leaderboard?metric=activities&limit=100"),
  ]);
  if (!distance.ok) return distance;
  const completed = new Map<string, number>();
  if (counts.ok) counts.data.forEach((row) => completed.set(String(row.user_id), row.score));
  return {
    ok: true,
    data: distance.data.map((row) => {
      const userId = rememberBackendUser({
        user_id: row.user_id,
        username: row.username,
        display_name: row.display_name,
        photo: row.photo ?? null,
      });
      return { userId, rank: row.rank, distanceKm: row.score, completedCount: completed.get(userId) ?? 0 };
    }),
  };
}
