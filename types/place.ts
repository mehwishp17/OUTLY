import type { IconName } from "@/components/ui/icon";

/**
 * Shared types for the Explore module (Explore Home, Search, Filters,
 * Map, Place Detail, Trail Detail). Data lives in `lib/mock/mock-places.ts`
 * only — there is no backend, and nothing here is persisted beyond the
 * "saved" state already tracked on `UserProfile.savedPlaces`
 * (`context/social-store-context.tsx`).
 */

export type PlaceCategory = "trail" | "viewpoint" | "campsite" | "cycling-route" | "wildlife";

export type Difficulty = "easy" | "moderate" | "hard";

/**
 * A schematic (not geographically accurate) position used to place a pin
 * on the illustrative Explore map — see `explore-map-view.tsx`. There is
 * no real map provider/API key configured for this frontend-only phase.
 */
export type MapPosition = {
  x: number;
  y: number;
};

export type ExplorePlace = {
  id: string;
  /** Distinguishes "Place Detail" from "Trail Detail" screens — trails
   * additionally carry `routePoints`. */
  kind: "place" | "trail";
  name: string;
  description: string;
  category: PlaceCategory;
  difficulty: Difficulty;
  distanceKm: number;
  durationLabel: string;
  location: string;
  facilities: string[];
  safetyNotes?: string;
  gradient: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  mapPosition: MapPosition;
  /** Simple route geometry preview for trails only (schematic, not real
   * geodata) — rendered as an SVG polyline on the trail detail page. */
  routePoints?: MapPosition[];
};

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
