import { CURRENT_USER_ID } from "@/lib/mock/mock-user";
import { getPublicUserById } from "@/lib/mock/mock-users";
import type { UserProfile } from "@/types/profile";

export type ResolvedUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  interests: string[];
  skillLevel: UserProfile["skillLevel"];
  isCurrentUser: boolean;
};

/**
 * Resolves any user id to a display-ready summary, whether it's the
 * current mock "signed-in" user (whose live profile lives in
 * `social-store-context`) or another seeded user (`mock-users.ts`).
 * Used across the Social Graph module so callers don't need to branch on
 * "is this me?" themselves.
 */
export function resolveUserSummary(userId: string, currentUser: UserProfile): ResolvedUser | undefined {
  if (userId === CURRENT_USER_ID) {
    return {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      bio: currentUser.bio,
      location: currentUser.location,
      interests: currentUser.interests,
      skillLevel: currentUser.skillLevel,
      isCurrentUser: true,
    };
  }

  const other = getPublicUserById(userId);
  if (!other) return undefined;

  return { ...other, isCurrentUser: false };
}
