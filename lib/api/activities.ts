import { callBackend, fetchAll, firstError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";
import type { Activity, ActivityKind, ActivityParticipant, ActivityPrivacy, CreateActivityInput } from "@/types/activity";
import type { Difficulty } from "@/types/place";
import type { ActivityType, CompletedActivity } from "@/types/profile";

/**
 * Activities client (`/api/backend/activities/...`):
 *   GET/POST   activities/                list (everything visible to me) / create
 *   GET/PATCH/DELETE activities/{id}/     detail / edit / delete
 *   POST/DELETE activities/{id}/join/     join / leave
 *   GET        activities/{id}/participants/
 *   GET        activities/history/        my completed activities
 */

type BackendActivity = {
  id: number;
  title: string;
  activity_type: string;
  created_by_id: number;
  creator_name?: string;
  place_id?: number | null;
  trail_id?: number | null;
  location?: string;
  start_at?: string | null;
  end_at?: string | null;
  distance?: string | number | null;
  duration?: string | null;
  difficulty?: string;
  notes?: string;
  privacy: string;
  status: string;
  completed_at?: string | null;
  participants_count?: number;
  created_at: string;
};

type BackendParticipant = { user_id: number; username: string; display_name?: string };

const KIND_FROM_BACKEND: Record<string, ActivityKind> = {
  HIKE: "hike",
  TRAIL_RUN: "trail-run",
  CYCLING: "cycling",
  CAMPING: "camping",
  MEETUP: "meetup",
};
const KIND_TO_BACKEND: Record<ActivityKind, string> = {
  hike: "HIKE",
  "trail-run": "TRAIL_RUN",
  cycling: "CYCLING",
  camping: "CAMPING",
  meetup: "MEETUP",
};

/** "3 hours", "2.5 h", "90 min", "1 day", "1h 30m" -> total seconds. */
export function parseDurationLabel(text: string): number | undefined {
  const value = text.trim().toLowerCase();
  if (!value) return undefined;
  let seconds = 0;
  let matched = false;
  for (const match of value.matchAll(/(\d+(?:\.\d+)?)\s*(days?|d|hours?|hrs?|h|minutes?|mins?|m)\b/g)) {
    matched = true;
    const amount = Number(match[1]);
    const unit = match[2];
    if (unit.startsWith("d")) seconds += amount * 86400;
    else if (unit.startsWith("h")) seconds += amount * 3600;
    else seconds += amount * 60;
  }
  if (!matched && /^\d+(\.\d+)?$/.test(value)) {
    // a bare number is read as hours
    return Math.round(Number(value) * 3600);
  }
  return matched && seconds > 0 ? Math.round(seconds) : undefined;
}

/** Backend "[D ]HH:MM:SS" -> "3 hours". */
export function formatDuration(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/^(?:(\d+)\s+)?(\d+):(\d+):(\d+)/);
  if (!match) return undefined;
  const totalMinutes = Number(match[1] ?? 0) * 1440 + Number(match[2]) * 60 + Number(match[3]);
  if (totalMinutes <= 0) return undefined;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes) parts.push(`${minutes} min`);
  return parts.join(" ");
}

export function mapActivity(raw: BackendActivity): Activity {
  const creatorId = rememberBackendUser({ user_id: raw.created_by_id, username: raw.creator_name, display_name: raw.creator_name });
  const difficulty = raw.difficulty ? (raw.difficulty.toLowerCase() as Difficulty) : undefined;
  return {
    id: String(raw.id),
    creatorId,
    creatorName: raw.creator_name || "OUTLY member",
    title: raw.title,
    type: KIND_FROM_BACKEND[raw.activity_type] ?? "hike",
    placeId: raw.place_id ? `place-${raw.place_id}` : raw.trail_id ? `trail-${raw.trail_id}` : undefined,
    location: raw.location ?? "",
    startAt: raw.start_at ?? raw.created_at,
    endAt: raw.end_at ?? undefined,
    distanceKm: raw.distance === null || raw.distance === undefined ? undefined : Number(raw.distance) || undefined,
    durationLabel: formatDuration(raw.duration),
    difficulty,
    notes: raw.notes || undefined,
    privacy: raw.privacy.toLowerCase() as ActivityPrivacy,
    status: raw.status === "COMPLETED" ? "completed" : "planned",
    participantCount: raw.participants_count ?? 0,
    participants: [],
  };
}

/** Frontend form values -> request body. Returns an error message for input the backend can't store. */
function toBody(input: CreateActivityInput): { body?: Record<string, unknown>; error?: string } {
  const body: Record<string, unknown> = {
    title: input.title.trim(),
    activity_type: KIND_TO_BACKEND[input.type],
    location: input.location.trim(),
    start_at: input.startAt || null,
    distance: input.distanceKm ?? null,
    difficulty: input.difficulty ? input.difficulty.toUpperCase() : "",
    notes: input.notes?.trim() ?? "",
    privacy: input.privacy.toUpperCase(),
    status: input.status.toUpperCase(),
    place_id: null,
    trail_id: null,
  };
  if (input.placeId) {
    const [kind, id] = input.placeId.split("-");
    body[kind === "trail" ? "trail_id" : "place_id"] = Number(id);
  }
  const label = input.durationLabel?.trim();
  if (label) {
    const seconds = parseDurationLabel(label);
    if (seconds === undefined) return { error: "Enter the duration like “3 hours”, “90 min” or “1 day”." };
    body.duration = seconds;
  } else {
    body.duration = null;
  }
  return { body };
}

export async function fetchActivities(): Promise<ApiResult<Activity[]>> {
  const result = await fetchAll<BackendActivity>("activities", 200);
  return result.ok ? { ok: true, data: result.data.map(mapActivity) } : result;
}

export async function fetchActivity(activityId: string): Promise<ApiResult<Activity>> {
  const [detail, people] = await Promise.all([
    callBackend<BackendActivity>("GET", `activities/${activityId}`),
    fetchAll<BackendParticipant>(`activities/${activityId}/participants`, 200),
  ]);
  if (!detail.ok) return detail;
  const activity = mapActivity(detail.data);
  if (people.ok) activity.participants = people.data.map(mapParticipant);
  return { ok: true, data: activity };
}

function mapParticipant(raw: BackendParticipant): ActivityParticipant {
  const id = rememberBackendUser({ user_id: raw.user_id, username: raw.username, display_name: raw.display_name });
  return { id, name: raw.display_name || raw.username };
}

export async function createActivityRequest(input: CreateActivityInput): Promise<ApiResult<Activity>> {
  const { body, error } = toBody(input);
  if (!body) return { ok: false, status: 400, message: error ?? "Invalid activity." };
  const result = await callBackend<BackendActivity>("POST", "activities", body);
  return result.ok ? { ok: true, data: mapActivity(result.data) } : { ...result, message: firstError(result) };
}

export async function editActivityRequest(activityId: string, input: CreateActivityInput): Promise<ApiResult<Activity>> {
  const { body, error } = toBody(input);
  if (!body) return { ok: false, status: 400, message: error ?? "Invalid activity." };
  const result = await callBackend<BackendActivity>("PATCH", `activities/${activityId}`, body);
  return result.ok ? { ok: true, data: mapActivity(result.data) } : { ...result, message: firstError(result) };
}

export function deleteActivityRequest(activityId: string): Promise<ApiResult<void>> {
  return callBackend<void>("DELETE", `activities/${activityId}`);
}

export async function joinActivityRequest(activityId: string, join: boolean): Promise<ApiResult<unknown>> {
  const result = await callBackend(join ? "POST" : "DELETE", `activities/${activityId}/join`);
  return result.ok ? result : { ...result, message: firstError(result) };
}

const PROFILE_TYPE: Record<string, ActivityType> = {
  HIKE: "hike",
  TRAIL_RUN: "trail",
  CYCLING: "trail",
  CAMPING: "camp",
  MEETUP: "meetup",
};

/** The profile's "Activity history": my completed activities, newest first. */
export async function fetchCompletedActivities(): Promise<ApiResult<CompletedActivity[]>> {
  const result = await fetchAll<BackendActivity>("activities/history", 100);
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data
      .map((raw) => ({ raw, when: new Date(raw.completed_at ?? raw.start_at ?? raw.created_at) }))
      .sort((a, b) => b.when.getTime() - a.when.getTime())
      .map(({ raw, when }) => ({
        id: String(raw.id),
        title: raw.title,
        location: raw.location ?? "",
        completedOn: when.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        type: PROFILE_TYPE[raw.activity_type] ?? "hike",
      })),
  };
}
