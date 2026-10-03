import type { IconName } from "@/components/ui/icon";

/**
 * Shared types for the Explore module (Explore Home, Search, Filters,
 * Map, Place Detail, Trail Detail). Places and trails are loaded from the
 * OUTLY backend by `lib/api/places.ts`.
 */

export type PlaceCategory = "trail" | "viewpoint" | "campsite" | "cycling-route" | "wildlife";

export type Difficulty = "easy" | "moderate" | "hard";

/**
 * A schematic position used to place a pin on the illustrative Explore map
 * (percentages of the canvas), derived from the place's real coordinates —
 * see `explore-map-view.tsx`. There is no map provider key configured.
 */
export type MapPosition = {
  x: number;
  y: number;
};

export type ExplorePlace = {
  /** Backend id. Places and trails have separate id spaces, so always pair
   * it with `kind` (see `exploreKey`). */
  id: string;
  /** Distinguishes "Place Detail" from "Trail Detail" screens — trails
   * additionally carry `routePoints`. */
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
  mapPosition: MapPosition;
  /** Simple route preview for trails only, derived from the trail's real
   * route points and normalised to the preview canvas. */
  routePoints?: MapPosition[];
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
