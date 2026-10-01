import { callBackend } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

/**
 * The signed-in user, from `GET /api/v1/users/me/`. Only the fields the
 * frontend uses are typed. `photo`, `interests` and `privacy_settings` are
 * untyped in the Swagger schema, so they are validated where they are read.
 */
export type MyProfile = {
  user_id: number;
  email: string;
  username: string;
  display_name?: string;
  photo?: unknown;
  bio?: string;
  interests?: unknown;
  privacy_settings?: unknown;
};

/** What `PATCH /api/v1/users/me/` accepts that the Profile UI can edit. */
export type ProfilePatch = {
  display_name?: string;
  username?: string;
  bio?: string;
  interests?: string[];
};

export function fetchMyProfile(): Promise<ApiResult<MyProfile>> {
  return callBackend<MyProfile>("GET", "users/me");
}

export async function patchMyProfile(patch: ProfilePatch): Promise<ApiResult<MyProfile>> {
  const result = await callBackend<MyProfile>("PATCH", "users/me", patch);
  if (result.ok || !result.errors) return result;

  // Surface the first field error (e.g. "username already taken") to the user.
  const first = Object.values(result.errors)[0];
  const text = Array.isArray(first) ? first[0] : first;
  return { ...result, message: text || result.message };
}

export function profileName(me: MyProfile): string {
  return me.display_name || me.username || "OUTLY member";
}

export function profilePhoto(me: MyProfile): string | undefined {
  return typeof me.photo === "string" && me.photo ? me.photo : undefined;
}

export function profileInterests(me: MyProfile): string[] {
  return Array.isArray(me.interests)
    ? me.interests.filter((item): item is string => typeof item === "string")
    : [];
}
