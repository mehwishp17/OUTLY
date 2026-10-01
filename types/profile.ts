/**
 * Shared types for the Phase 3 profile module. All profile data lives in
 * `context/social-store-context.tsx` (seeded from `lib/mock/mock-user.ts`)
 * for the duration of the browser session only — nothing here is
 * persisted to a backend, `localStorage`, or a database.
 */

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type ProfileVisibility = "public" | "communityOnly" | "private";

export type ActivityType = "hike" | "meetup" | "trail" | "camp";

export type CompletedActivity = {
  id: string;
  title: string;
  location: string;
  completedOn: string;
  type: ActivityType;
};

/**
 * A saved place/experience. Reuses the same title/location/category shape
 * as the Phase 1 `Experience` type (`lib/constants.ts`) so saved items
 * read consistently with the "Featured experiences" section.
 */
export type SavedPlace = {
  id: string;
  title: string;
  location: string;
  category: string;
};

export type PrivacySettings = {
  profileVisibility: ProfileVisibility;
  showActivityHistory: boolean;
  showSavedPlaces: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  location?: string;
  bio?: string;
  interests: string[];
  skillLevel: SkillLevel;
  joinedCommunities: string[];
  savedPlaces: SavedPlace[];
  completedActivities: CompletedActivity[];
  privacy: PrivacySettings;
};

export type EditProfileValues = {
  name: string;
  username: string;
  location: string;
  bio: string;
  interests: string[];
  skillLevel: SkillLevel;
};

export type EditProfileErrors = Partial<Record<keyof EditProfileValues, string>>;
