import type { UserProfile } from "@/types/profile";

/**
 * ID of the single mock "current user" for this phase. Every post,
 * comment, like, and save performed through the UI is attributed to this
 * user — there is no real authentication, so this is a stand-in rather
 * than a signed-in identity.
 */
export const CURRENT_USER_ID = "neha-kapoor";

/**
 * The mock signed-in user, loosely based on "Neha Kapoor" from the Phase 1
 * stories section. Seeded once into `social-store-context.tsx`; edits made
 * through /profile/edit and /profile/settings update the in-memory copy
 * only and reset on reload.
 */
export const MOCK_USER: UserProfile = {
  id: CURRENT_USER_ID,
  name: "Neha Kapoor",
  username: "nehak",
  avatarUrl: undefined,
  location: "Bengaluru, Karnataka",
  bio: "Weekend trekker, campfire storyteller, always chasing sunrise views. Building my OUTLY circle one trail at a time.",
  interests: ["hiking", "camping", "photography", "stargazing"],
  skillLevel: "intermediate",
  joinedCommunities: ["Bengaluru Trail Runners", "Weekend Wanderers", "Campfire Collective"],
  savedPlaces: [
    {
      id: "saved-1",
      title: "Golden Hour at Nandi Point",
      location: "Nandi Hills, Karnataka",
      category: "Sunset viewpoints",
    },
    {
      id: "saved-2",
      title: "Whispering Pines Trail",
      location: "Munnar, Kerala",
      category: "Forest trails",
    },
  ],
  completedActivities: [
    {
      id: "activity-1",
      title: "Sunrise Ridge Trek",
      location: "Kedarkantha, Uttarakhand",
      completedOn: "12 Jan 2026",
      type: "hike",
    },
    {
      id: "activity-2",
      title: "Lakeside Meetup & Campfire",
      location: "Pawna Lake, Maharashtra",
      completedOn: "28 Nov 2025",
      type: "meetup",
    },
    {
      id: "activity-3",
      title: "Whispering Pines Trail",
      location: "Munnar, Kerala",
      completedOn: "5 Oct 2025",
      type: "trail",
    },
  ],
  privacy: {
    profileVisibility: "public",
    showActivityHistory: true,
    showSavedPlaces: true,
  },
};
