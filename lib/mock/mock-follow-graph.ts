import { CURRENT_USER_ID } from "@/lib/mock/mock-user";

export type FollowEdge = {
  followerId: string;
  followingId: string;
};

/** Seed follow relationships for the Social Graph module. Frontend-only
 * — see `context/follow-store-context.tsx`. */
export const MOCK_FOLLOW_EDGES: FollowEdge[] = [
  { followerId: CURRENT_USER_ID, followingId: "rohan-mehta" },
  { followerId: CURRENT_USER_ID, followingId: "isha-verma" },
  { followerId: CURRENT_USER_ID, followingId: "vikram-rao" },
  { followerId: "rohan-mehta", followingId: CURRENT_USER_ID },
  { followerId: "isha-verma", followingId: CURRENT_USER_ID },
  { followerId: "arjun-das", followingId: CURRENT_USER_ID },
  { followerId: "vikram-rao", followingId: CURRENT_USER_ID },
  { followerId: "priya-nair", followingId: "rohan-mehta" },
  { followerId: "rohan-mehta", followingId: "arjun-das" },
  { followerId: "isha-verma", followingId: "rohan-mehta" },
];
