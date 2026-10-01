import type { SkillLevel } from "@/types/profile";

/**
 * Lightweight public-profile summary for every user besides the current
 * mock "signed-in" user (`MOCK_USER` in `mock-user.ts`). Used by the
 * Social Graph module (User Search, Public Profile, Followers,
 * Following) — frontend-only, resets on reload.
 */
export type PublicUserSummary = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  interests: string[];
  skillLevel: SkillLevel;
};

export const MOCK_OTHER_USERS: PublicUserSummary[] = [
  {
    id: "rohan-mehta",
    name: "Rohan Mehta",
    username: "rohanm",
    bio: "Trail leader, Pune. Real community, not just an app.",
    location: "Pune, Maharashtra",
    interests: ["hiking", "trail-running"],
    skillLevel: "advanced",
  },
  {
    id: "isha-verma",
    name: "Isha Verma",
    username: "ishav",
    bio: "Member since 2025, Delhi. Chasing sunrise views and quiet trails.",
    location: "Delhi",
    interests: ["photography", "nature-walks"],
    skillLevel: "intermediate",
  },
  {
    id: "arjun-das",
    name: "Arjun Das",
    username: "arjund",
    bio: "Camping, campfire stories, and a slight gear-collecting habit.",
    location: "Mumbai, Maharashtra",
    interests: ["camping", "stargazing"],
    skillLevel: "intermediate",
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    username: "priyan",
    bio: "First solo cycling weekend done — hooked ever since.",
    location: "Dehradun, Uttarakhand",
    interests: ["cycling", "road-trips"],
    skillLevel: "beginner",
  },
  {
    id: "vikram-rao",
    name: "Vikram Rao",
    username: "vikramr",
    bio: "Weekend summiteer, always looking for a trekking partner.",
    location: "Bengaluru, Karnataka",
    interests: ["hiking", "wildlife"],
    skillLevel: "advanced",
  },
];

export function getPublicUserById(id: string): PublicUserSummary | undefined {
  return MOCK_OTHER_USERS.find((user) => user.id === id);
}
