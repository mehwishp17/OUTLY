import { CURRENT_USER_ID } from "@/lib/mock/mock-user";
import type { PartnerRequest } from "@/types/partner";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Seed partner requests for the Adventure Partner module. Frontend-only
 * — see `context/partner-store-context.tsx`. */
export const MOCK_PARTNER_REQUESTS: PartnerRequest[] = [
  {
    id: "partner-kedarkantha-buddy",
    authorId: "rohan-mehta",
    authorName: "Rohan Mehta",
    activity: "hike",
    destination: "Kedarkantha, Uttarakhand",
    preferredAt: daysFromNow(25),
    experienceLevel: "advanced",
    spots: 2,
    description:
      "Looking for 1-2 experienced trekkers for a winter Kedarkantha attempt. Should be comfortable with snow and early starts.",
    status: "open",
    joinRequests: [
      { id: CURRENT_USER_ID, name: "Neha Kapoor", status: "pending", message: "I did this trek last winter — happy to join!" },
    ],
  },
  {
    id: "partner-dehradun-cycling",
    authorId: CURRENT_USER_ID,
    authorName: "Neha Kapoor",
    activity: "cycling",
    destination: "Dehradun, Uttarakhand",
    preferredAt: daysFromNow(14),
    experienceLevel: "intermediate",
    spots: 3,
    description: "First solo cycling weekend — looking for a few people to ride the foothills route together.",
    status: "open",
    joinRequests: [
      { id: "priya-nair", name: "Priya Nair", status: "accepted" },
    ],
  },
  {
    id: "partner-munnar-photography",
    authorId: "isha-verma",
    authorName: "Isha Verma",
    activity: "trail-run",
    destination: "Munnar, Kerala",
    preferredAt: daysFromNow(-5),
    experienceLevel: "beginner",
    spots: 4,
    description: "Photo walk through the tea gardens — all experience levels welcome, easy pace.",
    status: "closed",
    joinRequests: [
      { id: "arjun-das", name: "Arjun Das", status: "accepted" },
      { id: CURRENT_USER_ID, name: "Neha Kapoor", status: "accepted" },
    ],
  },
];

export function getPartnerRequestById(id: string): PartnerRequest | undefined {
  return MOCK_PARTNER_REQUESTS.find((request) => request.id === id);
}
