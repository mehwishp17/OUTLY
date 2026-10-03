import { callBackend, fetchAll } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";

/**
 * Social graph client:
 *   POST/DELETE users/{id}/follow/        follow / unfollow
 *   GET         users/{id}/followers/     people following {id}
 *   GET         users/{id}/following/     people {id} follows
 *   GET         users/?search=            find people
 */

type PersonRow = {
  user_id: number;
  username: string;
  display_name?: string;
  photo?: string | null;
  location?: string;
  skill_level?: "beginner" | "intermediate" | "advanced";
};

export type FollowOutcome = { status: "ACCEPTED" | "PENDING" };

export async function followRequest(userId: string): Promise<ApiResult<FollowOutcome>> {
  return callBackend<FollowOutcome>("POST", `users/${userId}/follow`);
}

export function unfollowRequest(userId: string): Promise<ApiResult<void>> {
  return callBackend<void>("DELETE", `users/${userId}/follow`);
}

async function loadIds(path: string): Promise<ApiResult<string[]>> {
  const result = await fetchAll<PersonRow>(path);
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => rememberBackendUser(row)) };
}

export function fetchFollowerIds(userId: string): Promise<ApiResult<string[]>> {
  return loadIds(`users/${userId}/followers`);
}

export function fetchFollowingIds(userId: string): Promise<ApiResult<string[]>> {
  return loadIds(`users/${userId}/following`);
}

/** People matching `term` by name/username (blocked users and yourself excluded). */
export async function searchPeople(term: string): Promise<ApiResult<string[]>> {
  const query = term.trim() ? `users?search=${encodeURIComponent(term.trim())}` : "users";
  const result = await fetchAll<PersonRow>(query, 100);
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => rememberBackendUser(row)) };
}
