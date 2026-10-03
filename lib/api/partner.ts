import { callBackend, fetchAll, firstError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";
import type { ActivityKind } from "@/types/activity";
import type { JoinRequest, JoinRequestStatus, PartnerRequest, PartnerRequestFormValues } from "@/types/partner";
import type { SkillLevel } from "@/types/profile";

/**
 * Partner requests client (`/api/backend/partner-requests/...`):
 *   GET/POST   partner-requests/                 upcoming requests / post one
 *   GET/PATCH/DELETE partner-requests/{id}/      detail / edit / delete (poster)
 *   POST       partner-requests/{id}/close/      close (poster)
 *   POST/DELETE partner-requests/{id}/join/      ask to join / withdraw
 *   GET        partner-requests/{id}/join-requests/            who asked (poster only)
 *   POST       partner-requests/{id}/join-requests/{jid}/review/ {decision}
 */

type BackendRequest = {
  id: number;
  owner_id: number;
  owner_name?: string;
  activity: string;
  destination: string;
  preferred_datetime: string;
  spots_total: number;
  spots_filled: number;
  experience_level: string;
  description: string;
  status: string;
  my_join_status?: string | null;
};

type BackendJoin = { id: number; user_id: number; user_name?: string; status: string; message?: string };

const JOIN_FROM: Record<string, JoinRequestStatus> = { PENDING: "pending", ACCEPTED: "accepted", REJECTED: "declined" };
const activityFrom = (raw: string) => raw.toLowerCase().replace("_", "-") as ActivityKind;
const activityTo = (kind: ActivityKind) => kind.toUpperCase().replace("-", "_");

export function mapRequest(raw: BackendRequest): PartnerRequest {
  const authorId = rememberBackendUser({ user_id: raw.owner_id, username: raw.owner_name, display_name: raw.owner_name });
  return {
    id: String(raw.id),
    authorId,
    authorName: raw.owner_name || "OUTLY member",
    activity: activityFrom(raw.activity),
    destination: raw.destination,
    preferredAt: raw.preferred_datetime,
    experienceLevel: raw.experience_level.toLowerCase() as SkillLevel,
    spots: raw.spots_total,
    spotsFilled: raw.spots_filled,
    description: raw.description,
    status: raw.status === "CLOSED" ? "closed" : "open",
    myJoinStatus: raw.my_join_status ? JOIN_FROM[raw.my_join_status] : undefined,
    joinRequests: [],
  };
}

function mapJoin(raw: BackendJoin): JoinRequest {
  const userId = rememberBackendUser({ user_id: raw.user_id, username: raw.user_name, display_name: raw.user_name });
  return {
    id: String(raw.id),
    userId,
    name: raw.user_name || "OUTLY member",
    message: raw.message || undefined,
    status: JOIN_FROM[raw.status] ?? "pending",
  };
}

function toBody(values: PartnerRequestFormValues) {
  return {
    activity: activityTo(values.activity),
    destination: values.destination.trim(),
    preferred_datetime: values.preferredAt,
    spots_total: values.spots,
    experience_level: values.experienceLevel.toUpperCase(),
    description: values.description.trim(),
  };
}

const withMessage = <T>(result: ApiResult<T>): ApiResult<T> => (result.ok ? result : { ...result, message: firstError(result) });

export async function fetchRequests(): Promise<ApiResult<PartnerRequest[]>> {
  const result = await fetchAll<BackendRequest>("partner-requests", 200);
  return result.ok ? { ok: true, data: result.data.map(mapRequest) } : result;
}

/** One request, plus its join requests when the signed-in user is the poster. */
export async function fetchRequest(requestId: string, viewerId: string): Promise<ApiResult<PartnerRequest>> {
  const detail = await callBackend<BackendRequest>("GET", `partner-requests/${requestId}`);
  if (!detail.ok) return detail;
  const request = mapRequest(detail.data);
  if (request.authorId === viewerId) {
    const joins = await fetchAll<BackendJoin>(`partner-requests/${requestId}/join-requests`, 200);
    if (joins.ok) request.joinRequests = joins.data.map(mapJoin);
  }
  return { ok: true, data: request };
}

export async function createRequestRequest(values: PartnerRequestFormValues): Promise<ApiResult<PartnerRequest>> {
  const result = withMessage(await callBackend<BackendRequest>("POST", "partner-requests", toBody(values)));
  return result.ok ? { ok: true, data: mapRequest(result.data) } : result;
}

export async function editRequestRequest(requestId: string, values: PartnerRequestFormValues): Promise<ApiResult<PartnerRequest>> {
  const result = withMessage(await callBackend<BackendRequest>("PATCH", `partner-requests/${requestId}`, toBody(values)));
  return result.ok ? { ok: true, data: mapRequest(result.data) } : result;
}

export function deleteRequestRequest(requestId: string): Promise<ApiResult<void>> {
  return callBackend<void>("DELETE", `partner-requests/${requestId}`);
}

export async function closeRequestRequest(requestId: string): Promise<ApiResult<unknown>> {
  return withMessage(await callBackend("POST", `partner-requests/${requestId}/close`));
}

export async function joinRequestRequest(requestId: string, message: string): Promise<ApiResult<unknown>> {
  return withMessage(await callBackend("POST", `partner-requests/${requestId}/join`, { message }));
}

export async function withdrawJoinRequestRequest(requestId: string): Promise<ApiResult<void>> {
  return withMessage(await callBackend<void>("DELETE", `partner-requests/${requestId}/join`));
}

export async function reviewJoinRequestRequest(requestId: string, joinId: string, accept: boolean): Promise<ApiResult<unknown>> {
  return withMessage(
    await callBackend("POST", `partner-requests/${requestId}/join-requests/${joinId}/review`, {
      decision: accept ? "ACCEPTED" : "REJECTED",
    }),
  );
}
