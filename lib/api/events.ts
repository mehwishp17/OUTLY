import { callBackend, fetchAll, firstError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";
import type {
  EventCategory,
  EventFormValues,
  EventParticipant,
  EventParticipantStatus,
  EventVisibility,
  OutlyEvent,
} from "@/types/event";
import type { Difficulty } from "@/types/place";

/**
 * Events client (`/api/backend/events/...`):
 *   GET/POST   events/                       upcoming (and ?past=true) / create
 *   GET/PATCH  events/{id}/                  detail / edit (organizer)
 *   DELETE     events/{id}/                  cancel (organizer); ?permanent=true deletes for good
 *   POST/DELETE events/{id}/join/            join (capacity-checked by the backend) / leave
 *   GET        events/{id}/participants/     participants (organizers also see pending requests)
 *   PATCH      events/{id}/participants/{uid}/ {status: APPROVED|REJECTED}
 */

type BackendEvent = {
  id: number;
  organizer_id: number;
  organizer_name?: string;
  title: string;
  description?: string;
  category: string;
  place_id?: number | null;
  trail_id?: number | null;
  location: string;
  meeting_point?: string;
  start_at: string;
  end_at?: string | null;
  capacity: number;
  difficulty?: string;
  requires_approval: boolean;
  visibility: string;
  status: string;
  approval_status?: string;
  approved_count?: number;
  my_status?: string | null;
};

type BackendParticipant = { user_id: number; username: string; display_name?: string; status: string };

const CATEGORY_FROM: Record<string, EventCategory> = {
  HIKE: "hike",
  TRAIL_RUN: "trail-run",
  CYCLING: "cycling",
  CAMPING: "camping",
  MEETUP: "meetup",
  CLEANUP_DRIVE: "cleanup",
};
const CATEGORY_TO: Record<EventCategory, string> = {
  hike: "HIKE",
  "trail-run": "TRAIL_RUN",
  cycling: "CYCLING",
  camping: "CAMPING",
  meetup: "MEETUP",
  cleanup: "CLEANUP_DRIVE",
};
const VISIBILITY_FROM: Record<string, EventVisibility> = { PUBLIC: "public", FOLLOWERS: "followers", INVITED: "private" };
const VISIBILITY_TO: Record<EventVisibility, string> = { public: "PUBLIC", followers: "FOLLOWERS", private: "INVITED" };
const PARTICIPANT_FROM: Record<string, EventParticipantStatus> = { APPROVED: "going", PENDING: "pending", REJECTED: "declined" };

function statusOf(raw: BackendEvent): OutlyEvent["status"] {
  if (raw.status === "CANCELLED") return "cancelled";
  return new Date(raw.end_at ?? raw.start_at).getTime() < Date.now() ? "completed" : "upcoming";
}

export function mapEvent(raw: BackendEvent): OutlyEvent {
  const organizerId = rememberBackendUser({
    user_id: raw.organizer_id,
    username: raw.organizer_name,
    display_name: raw.organizer_name,
  });
  return {
    id: String(raw.id),
    organizerId,
    organizerName: raw.organizer_name || "OUTLY member",
    title: raw.title,
    description: raw.description ?? "",
    category: CATEGORY_FROM[raw.category] ?? "meetup",
    placeId: raw.place_id ? `place-${raw.place_id}` : raw.trail_id ? `trail-${raw.trail_id}` : undefined,
    location: raw.location,
    meetingPoint: raw.meeting_point || undefined,
    startAt: raw.start_at,
    endAt: raw.end_at ?? undefined,
    capacity: raw.capacity,
    difficulty: raw.difficulty ? (raw.difficulty.toLowerCase() as Difficulty) : undefined,
    requiresApproval: raw.requires_approval,
    visibility: VISIBILITY_FROM[raw.visibility] ?? "public",
    status: statusOf(raw),
    approvalStatus: (raw.approval_status ?? "APPROVED").toLowerCase() as OutlyEvent["approvalStatus"],
    goingCount: raw.approved_count ?? 0,
    myStatus: raw.my_status ? PARTICIPANT_FROM[raw.my_status] : undefined,
    participants: [],
  };
}

function mapParticipant(raw: BackendParticipant): EventParticipant | undefined {
  const status = PARTICIPANT_FROM[raw.status];
  if (!status) return undefined; // invited-but-not-yet-joined people aren't participants
  const id = rememberBackendUser({ user_id: raw.user_id, username: raw.username, display_name: raw.display_name });
  return { id, name: raw.display_name || raw.username, status };
}

function toBody(values: EventFormValues): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: values.title.trim(),
    description: values.description.trim(),
    category: CATEGORY_TO[values.category],
    location: values.location.trim(),
    meeting_point: values.meetingPoint?.trim() ?? "",
    start_at: values.startAt,
    capacity: values.capacity,
    difficulty: values.difficulty ? values.difficulty.toUpperCase() : "",
    requires_approval: values.requiresApproval,
    visibility: VISIBILITY_TO[values.visibility],
    place_id: null,
    trail_id: null,
  };
  if (values.placeId) {
    const [kind, id] = values.placeId.split("-");
    body[kind === "trail" ? "trail_id" : "place_id"] = Number(id);
  }
  return body;
}

const withMessage = <T>(result: ApiResult<T>): ApiResult<T> => (result.ok ? result : { ...result, message: firstError(result) });

/** Upcoming and past events I can see, merged. */
export async function fetchEvents(): Promise<ApiResult<OutlyEvent[]>> {
  const [upcoming, past] = await Promise.all([
    fetchAll<BackendEvent>("events", 200),
    fetchAll<BackendEvent>("events?past=true", 200),
  ]);
  if (!upcoming.ok) return upcoming;
  if (!past.ok) return past;
  const seen = new Set<number>();
  const merged = [...upcoming.data, ...past.data].filter((raw) => (seen.has(raw.id) ? false : seen.add(raw.id)));
  return { ok: true, data: merged.map(mapEvent) };
}

export async function fetchEvent(eventId: string): Promise<ApiResult<OutlyEvent>> {
  const [detail, people] = await Promise.all([
    callBackend<BackendEvent>("GET", `events/${eventId}`),
    fetchAll<BackendParticipant>(`events/${eventId}/participants`, 500),
  ]);
  if (!detail.ok) return detail;
  const event = mapEvent(detail.data);
  if (people.ok) {
    event.participants = people.data.map(mapParticipant).filter((p): p is EventParticipant => Boolean(p));
  }
  return { ok: true, data: event };
}

export async function createEventRequest(values: EventFormValues): Promise<ApiResult<OutlyEvent>> {
  const result = withMessage(await callBackend<BackendEvent>("POST", "events", toBody(values)));
  return result.ok ? { ok: true, data: mapEvent(result.data) } : result;
}

export async function editEventRequest(eventId: string, values: EventFormValues): Promise<ApiResult<OutlyEvent>> {
  const result = withMessage(await callBackend<BackendEvent>("PATCH", `events/${eventId}`, toBody(values)));
  return result.ok ? { ok: true, data: mapEvent(result.data) } : result;
}

export async function cancelEventRequest(eventId: string): Promise<ApiResult<void>> {
  return withMessage(await callBackend<void>("DELETE", `events/${eventId}`));
}

export async function deleteEventRequest(eventId: string): Promise<ApiResult<void>> {
  return withMessage(await callBackend<void>("DELETE", `events/${eventId}?permanent=true`));
}

/** Join result: confirmed, or waiting for approval. A full event comes back as an error (409). */
export async function joinEventRequest(eventId: string): Promise<ApiResult<{ status: string }>> {
  return withMessage(await callBackend<{ status: string }>("POST", `events/${eventId}/join`));
}

export async function leaveEventRequest(eventId: string): Promise<ApiResult<void>> {
  return withMessage(await callBackend<void>("DELETE", `events/${eventId}/join`));
}

export async function decideParticipantRequest(eventId: string, userId: string, approve: boolean): Promise<ApiResult<unknown>> {
  return withMessage(
    await callBackend("PATCH", `events/${eventId}/participants/${userId}`, { status: approve ? "APPROVED" : "REJECTED" }),
  );
}
