/**
 * Shared types for the Groups & Communities module (Groups List, Group
 * Detail, Group Feed, Members, Create/Edit Group). Groups come from the
 * OUTLY backend (`lib/api/groups.ts`) and live in
 * `context/group-store-context.tsx`. Group Feed reuses the existing
 * `Post`/`PostCard`/comment components from the Social module — see
 * `Post.groupId` in `types/post.ts`.
 */

export type GroupVisibility = "public" | "private";

export type GroupRole = "owner" | "moderator" | "member";

export type GroupMember = {
  id: string;
  name: string;
  avatarUrl?: string;
  role: GroupRole;
};

/** Someone waiting for a moderator to let them into a private group. */
export type GroupJoinRequest = {
  id: string;
  userId: string;
  name: string;
  message?: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  category: string;
  visibility: GroupVisibility;
  gradient: string;
  /** Cover photo uploaded to the backend, if the group has one; the gradient is the fallback. */
  imageUrl?: string;
  rules?: string;
  ownerId: string;
  /** Total members (always present, including in list responses). */
  memberCount: number;
  /** The signed-in user's role in this group, if they are a member. */
  myRole?: GroupRole;
  /** Set while the signed-in user's request to join a private group is pending. */
  requestPending?: boolean;
  /** The member list — loaded with the group's detail. */
  members: GroupMember[];
  /** Pending join requests — loaded for owners and moderators only. */
  joinRequests: GroupJoinRequest[];
};

export type GroupFormValues = {
  name: string;
  description: string;
  category: string;
  visibility: GroupVisibility;
  rules?: string;
};

export type GroupFormErrors = Partial<Record<"name" | "description" | "category", string>>;

export const GROUP_ROLE_LABELS: Record<GroupRole, string> = {
  owner: "Owner",
  moderator: "Moderator",
  member: "Member",
};
