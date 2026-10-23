import type { IconName } from "@/components/ui/icon";

/**
 * Shared types for the Explore module (Explore Home, Search, Filters,
 * Map, Place Detail, Trail Detail). Places and trails are loaded from the
 * OUTLY backend by `lib/api/places.ts`.
 */

export type PlaceCategory = "trail" | "viewpoint" | "campsite" | "cycling-route" | "wildlife";

export type Difficulty = "easy" | "moderate" | "hard";

export type ExplorePlace = {
  /** Backend id. Places and trails have separate id spaces, so always pair
   * it with `kind` (see `exploreKey`). */
  id: string;
  /** Distinguishes "Place Detail" from "Trail Detail" screens. */
  kind: "place" | "trail";
  name: string;
  description: string;
  category: PlaceCategory;
  difficulty?: Difficulty;
  distanceKm?: number;
  durationLabel?: string;
  location: string;
  facilities: string[];
  safetyNotes?: string;
  gradient: string;
  /** A local `/images/...` photo for curated content; user-added places keep the gradient. */
  photo?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  /** Real coordinates from the backend (a place's position, or a trail's start point). */
  latitude?: number;
  longitude?: number;
  /** Great-circle distance in km from the `near` point of the request that returned this item. */
  distanceFromKm?: number;
  /**
   * A validated, recorded GPX track for a trail. Always absent for now: the backend does not yet
   * mark which stored route points are recorded, and the seeded points are generated, not recorded,
   * so no route is drawn from them. See docs/backend-integration.md.
   */
  track?: { lat: number; lng: number }[];
};

/** Unique key across places and trails (used for saved places). */
export function exploreKey(place: Pick<ExplorePlace, "kind" | "id">): string {
  return `${place.kind}-${place.id}`;
}

/** "6 km · 2.5 hours", skipping whatever the place doesn't have. */
export function exploreMeta(place: Pick<ExplorePlace, "distanceKm" | "durationLabel">): string {
  const parts: string[] = [];
  if (place.distanceKm) parts.push(`${place.distanceKm} km`);
  if (place.durationLabel) parts.push(place.durationLabel);
  return parts.join(" · ");
}

/** "20.2 km" under 10 km, "43 km" above: the distance the backend computed, never an estimate. */
export function formatDistanceKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  trail: "Trails",
  viewpoint: "Viewpoints",
  campsite: "Campsites",
  "cycling-route": "Cycling routes",
  wildlife: "Wildlife",
};

export const PLACE_CATEGORY_ICONS: Record<PlaceCategory, IconName> = {
  trail: "trail",
  viewpoint: "pin",
  campsite: "tent",
  "cycling-route": "bike",
  wildlife: "paw",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};
