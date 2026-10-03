import { callBackend, fetchAll, firstError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";
import type { Group, GroupFormValues, GroupJoinRequest, GroupMember, GroupRole } from "@/types/group";

/**
 * Groups client (`/api/backend/groups/...`):
 *   GET/POST   groups/                          list (?mine=true&search=&category=) / create
 *   GET/PATCH/DELETE groups/{id}/               detail / edit (owner) / delete (owner)
 *   POST/DELETE groups/{id}/join/               join (public) or request (private) / leave
 *   GET        groups/{id}/members/             members (members only for private groups)
 *   PATCH/DELETE groups/{id}/members/{uid}/     change role / remove (owner or moderator)
 *   GET        groups/{id}/join-requests/       pending requests (moderators)
 *   POST       groups/{id}/join-requests/{rid}/review/ {decision}
 * A group's own posts are handled by `lib/api/feed.ts` (`loadGroupFeed`).
 */

type BackendGroup = {
  id: number;
  name: string;
  category: string;
  description: string;
  visibility: string;
  rules?: string;
  owner: number;
  owner_name?: string;
  members_count?: number;
  my_role?: string | null;
  my_request_status?: string | null;
  image?: string | null;
};

type BackendMember = { user_id: number; username: string; display_name?: string; photo?: string | null; role: string };
type BackendJoinRequest = { id: number; user_id: number; username: string; display_name?: string; message?: string };

const GRADIENTS = [
  "linear-gradient(135deg, #351080, #7c3aed)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #5b21b6, #f6339a)",
  "linear-gradient(135deg, #351080, #ec4899)",
];

const roleFrom = (raw?: string | null): GroupRole | undefined => (raw ? (raw.toLowerCase() as GroupRole) : undefined);

export function mapGroup(raw: BackendGroup): Group {
  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description,
    category: raw.category,
    visibility: raw.visibility === "PRIVATE" ? "private" : "public",
    gradient: GRADIENTS[raw.id % GRADIENTS.length],
    imageUrl: raw.image || undefined,
    rules: raw.rules || undefined,
    ownerId: String(raw.owner),
    memberCount: raw.members_count ?? 0,
    myRole: roleFrom(raw.my_role),
    requestPending: raw.my_request_status === "PENDING",
    members: [],
    joinRequests: [],
  };
}

function mapMember(raw: BackendMember): GroupMember {
  const id = rememberBackendUser({
    user_id: raw.user_id,
    username: raw.username,
    display_name: raw.display_name,
    photo: raw.photo ?? null,
  });
  return { id, name: raw.display_name || raw.username, avatarUrl: raw.photo || undefined, role: roleFrom(raw.role) ?? "member" };
}

function mapJoinRequest(raw: BackendJoinRequest): GroupJoinRequest {
  const userId = rememberBackendUser({ user_id: raw.user_id, username: raw.username, display_name: raw.display_name });
  return { id: String(raw.id), userId, name: raw.display_name || raw.username, message: raw.message || undefined };
}

function toBody(values: GroupFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category.trim(),
    visibility: values.visibility.toUpperCase(),
    rules: values.rules?.trim() ?? "",
  };
}

/** Surfaces the first backend field error (e.g. "Group name must be at least 3 characters"). */
const withMessage = <T>(result: ApiResult<T>): ApiResult<T> =>
  result.ok ? result : { ...result, message: firstError(result) };

export async function fetchGroups(): Promise<ApiResult<Group[]>> {
  const result = await fetchAll<BackendGroup>("groups", 200);
  return result.ok ? { ok: true, data: result.data.map(mapGroup) } : result;
}

/** Names of the groups the signed-in user belongs to (profile "Joined communities"). */
export async function fetchMyGroupNames(): Promise<ApiResult<string[]>> {
  const result = await fetchAll<BackendGroup>("groups?mine=true", 100);
  return result.ok ? { ok: true, data: result.data.map((group) => group.name) } : result;
}

/** A group with its members (when visible to the viewer) and, for moderators, pending requests. */
export async function fetchGroup(groupId: string): Promise<ApiResult<Group>> {
  const detail = await callBackend<BackendGroup>("GET", `groups/${groupId}`);
  if (!detail.ok) return detail;
  const group = mapGroup(detail.data);
  const canSee = group.visibility === "public" || Boolean(group.myRole);
  const canModerate = group.myRole === "owner" || group.myRole === "moderator";
  const [members, requests] = await Promise.all([
    canSee ? fetchAll<BackendMember>(`groups/${groupId}/members`, 500) : Promise.resolve(undefined),
    canModerate ? fetchAll<BackendJoinRequest>(`groups/${groupId}/join-requests`, 100) : Promise.resolve(undefined),
  ]);
  if (members?.ok) group.members = members.data.map(mapMember);
  if (requests?.ok) group.joinRequests = requests.data.map(mapJoinRequest);
  return { ok: true, data: group };
}

export async function createGroupRequest(values: GroupFormValues): Promise<ApiResult<Group>> {
  const result = withMessage(await callBackend<BackendGroup>("POST", "groups", toBody(values)));
  return result.ok ? { ok: true, data: mapGroup(result.data) } : result;
}

export async function editGroupRequest(groupId: string, values: GroupFormValues): Promise<ApiResult<Group>> {
  const result = withMessage(await callBackend<BackendGroup>("PATCH", `groups/${groupId}`, toBody(values)));
  return result.ok ? { ok: true, data: mapGroup(result.data) } : result;
}

export function deleteGroupRequest(groupId: string): Promise<ApiResult<void>> {
  return callBackend<void>("DELETE", `groups/${groupId}`);
}

/** Joins a public group right away, or sends a request to a private one. */
export async function joinGroupRequest(groupId: string): Promise<ApiResult<{ status: "JOINED" | "REQUESTED" }>> {
  return withMessage(await callBackend<{ status: "JOINED" | "REQUESTED" }>("POST", `groups/${groupId}/join`, {}));
}

export async function leaveGroupRequest(groupId: string): Promise<ApiResult<void>> {
  return withMessage(await callBackend<void>("DELETE", `groups/${groupId}/join`));
}

export async function setMemberRoleRequest(groupId: string, userId: string, role: GroupRole): Promise<ApiResult<unknown>> {
  return withMessage(await callBackend("PATCH", `groups/${groupId}/members/${userId}`, { role: role.toUpperCase() }));
}

export async function removeMemberRequest(groupId: string, userId: string): Promise<ApiResult<void>> {
  return withMessage(await callBackend<void>("DELETE", `groups/${groupId}/members/${userId}`));
}

export async function reviewJoinRequest(groupId: string, requestId: string, accept: boolean): Promise<ApiResult<unknown>> {
  return withMessage(
    await callBackend("POST", `groups/${groupId}/join-requests/${requestId}/review`, {
      decision: accept ? "ACCEPTED" : "REJECTED",
    }),
  );
}
