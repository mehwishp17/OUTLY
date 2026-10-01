import { CURRENT_USER_ID } from "@/lib/mock/mock-user";
import type { OutlyEvent } from "@/types/event";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Seed events for the Events module. Frontend-only — see
 * `context/event-store-context.tsx`. */
export const MOCK_EVENTS: OutlyEvent[] = [
  {
    id: "event-sinhagad-group-hike",
    organizerId: "rohan-mehta",
    organizerName: "Rohan Mehta",
    title: "Sinhagad Saturday Morning Group Hike",
    description:
      "Organizing a Saturday morning group hike near Pune — easy pace, roughly 6km, perfect for anyone new to trekking.",
    category: "hike",
    placeId: "viewpoint-sinhagad",
    location: "Sinhagad, Pune",
    meetingPoint: "Sinhagad base parking lot",
    startAt: daysFromNow(4),
    capacity: 15,
    difficulty: "easy",
    requiresApproval: false,
    visibility: "public",
    status: "upcoming",
    participants: [
      { id: "rohan-mehta", name: "Rohan Mehta", status: "going" },
      { id: CURRENT_USER_ID, name: "Neha Kapoor", status: "going" },
      { id: "isha-verma", name: "Isha Verma", status: "going" },
      { id: "arjun-das", name: "Arjun Das", status: "going" },
    ],
  },
  {
    id: "event-kedarkantha-winter-batch",
    organizerId: CURRENT_USER_ID,
    organizerName: "Neha Kapoor",
    title: "Kedarkantha Winter Trek — February Batch",
    description:
      "A guided 2-day winter trek to Kedarkantha. Limited spots — approval required so we can confirm gear and fitness readiness.",
    category: "hike",
    placeId: "trail-kedarkantha",
    location: "Kedarkantha, Uttarakhand",
    meetingPoint: "Dehradun railway station, 6:00 AM",
    startAt: daysFromNow(21),
    capacity: 8,
    difficulty: "hard",
    requiresApproval: true,
    visibility: "public",
    status: "upcoming",
    participants: [
      { id: CURRENT_USER_ID, name: "Neha Kapoor", status: "going" },
      { id: "rohan-mehta", name: "Rohan Mehta", status: "pending" },
      { id: "priya-nair", name: "Priya Nair", status: "pending" },
    ],
  },
  {
    id: "event-pawna-lake-campfire",
    organizerId: "arjun-das",
    organizerName: "Arjun Das",
    title: "Pawna Lake Camping & Campfire Night",
    description:
      "An evening of camping, stories, and stargazing by the water. Bring your own tent or rent one on-site.",
    category: "camping",
    placeId: "campsite-pawna-lake",
    location: "Pawna Lake, Maharashtra",
    startAt: daysAgo(35),
    capacity: 20,
    difficulty: "easy",
    requiresApproval: false,
    visibility: "public",
    status: "completed",
    participants: [
      { id: "arjun-das", name: "Arjun Das", status: "going" },
      { id: "isha-verma", name: "Isha Verma", status: "going" },
      { id: CURRENT_USER_ID, name: "Neha Kapoor", status: "going" },
    ],
  },
  {
    id: "event-munnar-cleanup",
    organizerId: "isha-verma",
    organizerName: "Isha Verma",
    title: "Whispering Pines Trail Cleanup Drive",
    description:
      "A community cleanup along the Whispering Pines trail — gloves and bags provided, bring good shoes.",
    category: "cleanup",
    placeId: "trail-whispering-pines",
    location: "Munnar, Kerala",
    startAt: daysFromNow(10),
    capacity: 25,
    difficulty: "easy",
    requiresApproval: false,
    visibility: "public",
    status: "upcoming",
    participants: [{ id: "isha-verma", name: "Isha Verma", status: "going" }],
  },
];

export function getEventById(id: string): OutlyEvent | undefined {
  return MOCK_EVENTS.find((event) => event.id === id);
}
