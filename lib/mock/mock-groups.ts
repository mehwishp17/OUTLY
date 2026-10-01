import { CURRENT_USER_ID } from "@/lib/mock/mock-user";
import type { Group } from "@/types/group";

/** Seed groups for the Groups & Communities module. Frontend-only — see
 * `context/group-store-context.tsx`. */
export const MOCK_GROUPS: Group[] = [
  {
    id: "group-bengaluru-trail-runners",
    name: "Bengaluru Trail Runners",
    description:
      "A weekend trail-running crew exploring the hills and forests around Bengaluru. All paces welcome.",
    category: "Trail running",
    visibility: "public",
    gradient: "linear-gradient(135deg, #351080, #7c3aed)",
    rules: "Be on time, respect the trail, and no littering.",
    members: [
      { id: CURRENT_USER_ID, name: "Neha Kapoor", role: "owner" },
      { id: "rohan-mehta", name: "Rohan Mehta", role: "moderator" },
      { id: "isha-verma", name: "Isha Verma", role: "member" },
    ],
  },
  {
    id: "group-weekend-wanderers",
    name: "Weekend Wanderers",
    description:
      "A general outdoor community for weekend hikes, camping trips, and impromptu meetups.",
    category: "General outdoors",
    visibility: "public",
    gradient: "linear-gradient(135deg, #7c3aed, #ec4899)",
    members: [
      { id: "rohan-mehta", name: "Rohan Mehta", role: "owner" },
      { id: CURRENT_USER_ID, name: "Neha Kapoor", role: "member" },
      { id: "arjun-das", name: "Arjun Das", role: "member" },
      { id: "priya-nair", name: "Priya Nair", role: "member" },
    ],
  },
  {
    id: "group-campfire-collective",
    name: "Campfire Collective",
    description:
      "Camping, campfire stories, and stargazing meetups around Maharashtra's lakes and hills.",
    category: "Camping",
    visibility: "public",
    gradient: "linear-gradient(135deg, #351080, #ec4899)",
    members: [
      { id: "arjun-das", name: "Arjun Das", role: "owner" },
      { id: CURRENT_USER_ID, name: "Neha Kapoor", role: "member" },
    ],
  },
  {
    id: "group-dehradun-cyclists",
    name: "Dehradun Foothill Cyclists",
    description:
      "A private group for regular cycling routes and ride planning around the Dehradun foothills.",
    category: "Cycling",
    visibility: "private",
    gradient: "linear-gradient(135deg, #5b21b6, #7c3aed)",
    rules: "Members only — request access from an existing rider.",
    members: [
      { id: "priya-nair", name: "Priya Nair", role: "owner" },
      { id: "isha-verma", name: "Isha Verma", role: "member" },
    ],
  },
];

export function getGroupByIdFromSeed(id: string): Group | undefined {
  return MOCK_GROUPS.find((group) => group.id === id);
}
