import { callBackend, firstError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberUser } from "@/lib/user-directory";
import type { PrivacySettings, SkillLevel } from "@/types/profile";

/** The signed-in user, from `GET /api/v1/users/me/`. */
export type MyProfile = {
  user_id: number;
  email: string;
  username: string;
  display_name?: string;
  role?: string;
  status?: string;
  email_verified?: boolean;
  photo?: string | null;
  cover_photo?: string | null;
  bio?: string;
  interests?: string[];
  location?: string;
  skill_level?: SkillLevel;
  privacy_settings?: Partial<PrivacySettings> & { requireFollowApproval?: boolean };
  stats?: { posts?: number; followers?: number; following?: number; activities_completed?: number; badges?: number };
  onboarding_completed?: boolean;
};

/** What `PATCH /api/v1/users/me/` accepts that the Profile UI can edit. */
export type ProfilePatch = {
  display_name?: string;
  username?: string;
  bio?: string;
  interests?: string[];
  location?: string;
  skill_level?: SkillLevel;
  privacy_settings?: Partial<PrivacySettings> & { requireFollowApproval?: boolean };
  onboarding_completed?: boolean;
};

/** Another member's profile, from `GET /api/v1/users/{id}/` (privacy-aware:
 * restricted profiles omit the optional fields). */
export type PublicProfile = {
  user_id: number;
  username: string;
  display_name?: string;
  photo?: string | null;
  follow_status: "SELF" | "NONE" | "ACCEPTED" | "PENDING";
  is_restricted: boolean;
  bio?: string;
  interests?: string[];
  location?: string;
  skill_level?: SkillLevel;
  cover_photo?: string | null;
  stats?: { posts?: number; followers?: number; following?: number; activities_completed?: number; badges?: number };
};

export function fetchMyProfile(): Promise<ApiResult<MyProfile>> {
  return callBackend<MyProfile>("GET", "users/me");
}

export async function patchMyProfile(patch: ProfilePatch): Promise<ApiResult<MyProfile>> {
  const result = await callBackend<MyProfile>("PATCH", "users/me", patch);
  if (result.ok) return result;
  // Surface the first field error (e.g. "username already taken") to the user.
  return { ...result, message: firstError(result) };
}

/** Uploads a new avatar image (multipart). */
export function uploadMyAvatar(file: File): Promise<ApiResult<MyProfile>> {
  const form = new FormData();
  form.append("photo", file);
  return callBackend<MyProfile>("POST", "users/me/photo", form);
}

export function removeMyAvatar(): Promise<ApiResult<MyProfile>> {
  return callBackend<MyProfile>("DELETE", "users/me/photo");
}

export function profileName(me: { display_name?: string; username: string }): string {
  return me.display_name || me.username || "OUTLY member";
}

export function profilePhoto(me: { photo?: string | null }): string | undefined {
  return typeof me.photo === "string" && me.photo ? me.photo : undefined;
}

export function profileInterests(me: { interests?: unknown }): string[] {
  return Array.isArray(me.interests)
    ? me.interests.filter((item): item is string => typeof item === "string")
    : [];
}

/** Registers any `{user_id, username, display_name, photo...}` row in the
 * shared directory and returns the id as a string. */
export function rememberBackendUser(raw: {
  user_id: number | string;
  username?: string;
  display_name?: string;
  photo?: string | null;
  bio?: string;
  location?: string;
  interests?: string[];
  skill_level?: SkillLevel;
  is_restricted?: boolean;
}): string {
  const id = String(raw.user_id);
  rememberUser({
    id,
    name: raw.display_name || raw.username,
    username: raw.username,
    avatarUrl: raw.photo === undefined ? undefined : raw.photo,
    bio: raw.bio,
    location: raw.location,
    interests: raw.interests,
    skillLevel: raw.skill_level,
    restricted: raw.is_restricted,
  });
  return id;
}

/** Loads (and remembers) another member's profile. */
export async function fetchPublicProfile(userId: string): Promise<ApiResult<PublicProfile>> {
  const result = await callBackend<PublicProfile>("GET", `users/${userId}`);
  if (result.ok) rememberBackendUser(result.data);
  return result;
}
