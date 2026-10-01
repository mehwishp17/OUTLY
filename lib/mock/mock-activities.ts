import { CURRENT_USER_ID } from "@/lib/mock/mock-user";
import type { Activity } from "@/types/activity";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Seed activities for the Activities module (planned + completed).
 * Frontend-only — see `context/activity-store-context.tsx`. */
export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "activity-kedarkantha-trek",
    creatorId: CURRENT_USER_ID,
    creatorName: "Neha Kapoor",
    title: "Sunrise Ridge Trek",
    type: "hike",
    placeId: "trail-kedarkantha",
    location: "Kedarkantha, Uttarakhand",
    startAt: daysAgo(45),
    distanceKm: 20,
    durationLabel: "2 days",
    difficulty: "hard",
    notes: "Winter attempt — carried microspikes above 3,200m.",
    privacy: "public",
    status: "completed",
    participants: [
      { id: CURRENT_USER_ID, name: "Neha Kapoor" },
      { id: "rohan-mehta", name: "Rohan Mehta" },
    ],
  },
  {
    id: "activity-pawna-campfire",
    creatorId: "rohan-mehta",
    creatorName: "Rohan Mehta",
    title: "Lakeside Meetup & Campfire",
    type: "camping",
    placeId: "campsite-pawna-lake",
    location: "Pawna Lake, Maharashtra",
    startAt: daysAgo(120),
    distanceKm: 3,
    durationLabel: "Overnight",
    difficulty: "easy",
    privacy: "public",
    status: "completed",
    participants: [
      { id: "rohan-mehta", name: "Rohan Mehta" },
      { id: CURRENT_USER_ID, name: "Neha Kapoor" },
      { id: "isha-verma", name: "Isha Verma" },
    ],
  },
  {
    id: "activity-sinhagad-weekend-hike",
    creatorId: "rohan-mehta",
    creatorName: "Rohan Mehta",
    title: "Sinhagad Weekend Hike",
    type: "hike",
    placeId: "viewpoint-sinhagad",
    location: "Sinhagad, Pune",
    startAt: daysFromNow(6),
    distanceKm: 6,
    durationLabel: "2 hours",
    difficulty: "easy",
    notes: "Easy pace, perfect for anyone new to trekking. Meet at the base at 6am.",
    privacy: "public",
    status: "planned",
    participants: [
      { id: "rohan-mehta", name: "Rohan Mehta" },
      { id: CURRENT_USER_ID, name: "Neha Kapoor" },
    ],
  },
  {
    id: "activity-dehradun-cycling",
    creatorId: CURRENT_USER_ID,
    creatorName: "Neha Kapoor",
    title: "Foothills Cycling Weekend",
    type: "cycling",
    placeId: "cycling-dehradun-foothills",
    location: "Dehradun, Uttarakhand",
    startAt: daysFromNow(14),
    distanceKm: 45,
    durationLabel: "3–4 hours",
    difficulty: "moderate",
    notes: "First solo cycling weekend — following the community route notes.",
    privacy: "public",
    status: "planned",
    participants: [{ id: CURRENT_USER_ID, name: "Neha Kapoor" }],
  },
  {
    id: "activity-munnar-photo-walk",
    creatorId: "isha-verma",
    creatorName: "Isha Verma",
    title: "Tea Gardens Photo Walk",
    type: "trail-run",
    placeId: "trail-munnar-tea-gardens",
    location: "Munnar, Kerala",
    startAt: daysAgo(10),
    distanceKm: 9,
    durationLabel: "3 hours",
    difficulty: "easy",
    privacy: "public",
    status: "completed",
    participants: [{ id: "isha-verma", name: "Isha Verma" }],
  },
];

export function getActivityById(id: string): Activity | undefined {
  return MOCK_ACTIVITIES.find((activity) => activity.id === id);
}
