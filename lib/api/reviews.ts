import { callBackend, fetchAll, firstError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";

/**
 * Reviews client (`/api/backend/...`):
 *   GET/POST places/{id}/reviews/ , trails/{id}/reviews/ , events/{id}/reviews/
 *   PATCH/DELETE reviews/{id}/
 * The backend keeps each place's and trail's average rating exact and allows
 * one review per person per target (event reviews: attendees, after it ends).
 */

export type ReviewTarget = "place" | "trail" | "event";

export type Review = {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string;
  rating: number;
  text: string;
  createdAt: string;
  isMine: boolean;
};

type BackendReview = {
  id: number;
  user_id: number;
  author_name?: string;
  author_photo?: string | null;
  rating: number;
  text?: string;
  created_at: string;
  is_mine: boolean;
};

const segment = (target: ReviewTarget) => (target === "place" ? "places" : target === "trail" ? "trails" : "events");

function mapReview(raw: BackendReview): Review {
  const userId = rememberBackendUser({
    user_id: raw.user_id,
    username: raw.author_name,
    display_name: raw.author_name,
    photo: raw.author_photo ?? undefined,
  });
  return {
    id: String(raw.id),
    userId,
    authorName: raw.author_name || "OUTLY member",
    authorAvatarUrl: raw.author_photo || undefined,
    rating: raw.rating,
    text: raw.text ?? "",
    createdAt: raw.created_at,
    isMine: raw.is_mine,
  };
}

export async function fetchReviews(target: ReviewTarget, id: string): Promise<ApiResult<Review[]>> {
  const result = await fetchAll<BackendReview>(`${segment(target)}/${id}/reviews`, 100);
  return result.ok ? { ok: true, data: result.data.map(mapReview) } : result;
}

export async function submitReview(target: ReviewTarget, id: string, rating: number, text: string): Promise<ApiResult<Review>> {
  const result = await callBackend<BackendReview>("POST", `${segment(target)}/${id}/reviews`, { rating, text });
  return result.ok ? { ok: true, data: mapReview(result.data) } : { ...result, message: firstError(result) };
}

export async function updateReview(reviewId: string, rating: number, text: string): Promise<ApiResult<Review>> {
  const result = await callBackend<BackendReview>("PATCH", `reviews/${reviewId}`, { rating, text });
  return result.ok ? { ok: true, data: mapReview(result.data) } : { ...result, message: firstError(result) };
}

export function deleteReview(reviewId: string): Promise<ApiResult<void>> {
  return callBackend<void>("DELETE", `reviews/${reviewId}`);
}
