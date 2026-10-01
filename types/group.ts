/**
 * Shared types for the Groups & Communities module (Groups List, Group
 * Detail, Group Feed, Members, Create/Edit Group). Data lives in
 * `context/group-store-context.tsx` for the browser session only —
 * frontend-only, same pattern as the other domain modules. Group Feed
 * reuses the existing `Post`/`PostCard`/comment components from the
 * Social module rather than a parallel implementation — see `Post.groupId`
 * in `types/post.ts`.
 */

export type GroupVisibility = "public" | "private";

export type GroupRole = "owner" | "moderator" | "member";

export type GroupMember = {
  id: string;
  name: string;
  avatarUrl?: string;
  role: GroupRole;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  category: string;
  visibility: GroupVisibility;
  gradient: string;
  rules?: string;
  members: GroupMember[];
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
