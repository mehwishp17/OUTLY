import { callBackend, fetchAll } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { SavedPlace } from "@/types/profile";
import { PLACE_CATEGORY_LABELS, exploreKey } from "@/types/place";
import type { Difficulty, ExplorePlace, MapPosition, PlaceCategory } from "@/types/place";

/**
 * Explore client (places + trails), reached through `/api/backend/*`:
 *
 *   GET places/?search=&category=&difficulty=&min_rating=&near=   list / search / filter
 *   GET places/{id}/ , trails/{id}/                                detail (trails include route points)
 *   POST/DELETE places/{id}/save/ , trails/{id}/save/              bookmark
 *   GET users/me/saved-places/ , users/me/saved-trails/            my bookmarks
 */

type BackendPoint = { latitude: string | number; longitude: string | number; sequence: number };

type BackendExplorable = {
  id: number;
  name: string;
  description?: string;
  location?: string;
  category?: string;
  difficulty?: string;
  distance?: string | number | null;
  duration_label?: string;
  facilities?: string[];
  safety_notes?: string;
  images?: string[];
  rating?: string | number;
  reviews_count?: number;
  is_verified?: boolean;
  is_saved?: boolean;
  /** Places */
  coordinates?: { latitude: number; longitude: number };
  /** Trails */
  start?: { latitude: number; longitude: number } | null;
  points?: BackendPoint[];
};

const CATEGORIES: PlaceCategory[] = ["trail", "viewpoint", "campsite", "cycling-route", "wildlife"];

const GRADIENTS = [
  "linear-gradient(135deg, #351080, #7c3aed)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #5b21b6, #f6339a)",
  "linear-gradient(135deg, #351080, #ec4899)",
  "linear-gradient(135deg, #7c3aed, #351080)",
  "linear-gradient(135deg, #ec4899, #f6339a)",
];

const DIFFICULTIES: Difficulty[] = ["easy", "moderate", "hard"];

/** Scales values into 10–90 so pins/lines never touch the canvas edge. */
function normalise(values: number[]): (value: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return (value) => 10 + ((value - min) / span) * 80;
}

function routeToPreview(points: BackendPoint[] | undefined): MapPosition[] | undefined {
  if (!points || points.length < 2) return undefined;
  const ordered = [...points].sort((a, b) => a.sequence - b.sequence);
  const lats = ordered.map((p) => Number(p.latitude));
  const lngs = ordered.map((p) => Number(p.longitude));
  const x = normalise(lngs);
  const y = normalise(lats);
  // North is up, so a larger latitude has a smaller y.
  return ordered.map((p) => ({ x: Math.round(x(Number(p.longitude))), y: Math.round(100 - y(Number(p.latitude))) }));
}

function coordinatesOf(raw: BackendExplorable): { lat: number; lng: number } | undefined {
  const c = raw.coordinates ?? raw.start;
  return c ? { lat: Number(c.latitude), lng: Number(c.longitude) } : undefined;
}

export function mapExplorable(raw: BackendExplorable, kind: "place" | "trail"): ExplorePlace {
  const category = CATEGORIES.includes(raw.category as PlaceCategory) ? (raw.category as PlaceCategory) : "trail";
  const difficulty = raw.difficulty?.toLowerCase() as Difficulty | undefined;
  const photo = raw.images?.find((image) => image.startsWith("/"));
  const distance = raw.distance === null || raw.distance === undefined ? undefined : Number(raw.distance);
  return {
    id: String(raw.id),
    kind,
    name: raw.name,
    description: raw.description ?? "",
    category,
    difficulty: difficulty && DIFFICULTIES.includes(difficulty) ? difficulty : undefined,
    distanceKm: distance && distance > 0 ? distance : undefined,
    durationLabel: raw.duration_label || undefined,
    location: raw.location ?? "",
    facilities: raw.facilities ?? [],
    safetyNotes: raw.safety_notes || undefined,
    gradient: GRADIENTS[raw.id % GRADIENTS.length],
    photo,
    rating: Number(raw.rating ?? 0),
    reviewCount: raw.reviews_count ?? 0,
    verified: Boolean(raw.is_verified),
    mapPosition: { x: 50, y: 50 },
    routePoints: kind === "trail" ? routeToPreview(raw.points) : undefined,
  };
}

/** Spreads the pins over the schematic map using their real coordinates. */
function withMapPositions(list: ExplorePlace[], coords: Map<string, { lat: number; lng: number }>): ExplorePlace[] {
  const known = list.map((p) => coords.get(exploreKey(p))).filter((c): c is { lat: number; lng: number } => Boolean(c));
  if (known.length === 0) return list;
  const x = normalise(known.map((c) => c.lng));
  const y = normalise(known.map((c) => c.lat));
  return list.map((place) => {
    const c = coords.get(exploreKey(place));
    return c ? { ...place, mapPosition: { x: Math.round(x(c.lng)), y: Math.round(100 - y(c.lat)) } } : place;
  });
}

export type ExploreQuery = {
  search?: string;
  category?: PlaceCategory | "all";
  difficulty?: Difficulty | "all";
};

function queryString(query: ExploreQuery): string {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.difficulty && query.difficulty !== "all") params.set("difficulty", query.difficulty.toUpperCase());
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** Places and trails matching the search/filters (the server does the filtering). */
export async function fetchExplore(query: ExploreQuery = {}): Promise<ApiResult<ExplorePlace[]>> {
  const qs = queryString(query);
  const [places, trails] = await Promise.all([
    fetchAll<BackendExplorable>(`places${qs}`),
    fetchAll<BackendExplorable>(`trails${qs}`),
  ]);
  if (!places.ok) return places;
  if (!trails.ok) return trails;
  const coords = new Map<string, { lat: number; lng: number }>();
  const mapped = [
    ...places.data.map((raw) => {
      const place = mapExplorable(raw, "place");
      const c = coordinatesOf(raw);
      if (c) coords.set(exploreKey(place), c);
      return place;
    }),
    ...trails.data.map((raw) => {
      const trail = mapExplorable(raw, "trail");
      const c = coordinatesOf(raw);
      if (c) coords.set(exploreKey(trail), c);
      return trail;
    }),
  ];
  return { ok: true, data: withMapPositions(mapped, coords).sort((a, b) => a.name.localeCompare(b.name)) };
}

export async function fetchExploreItem(kind: "place" | "trail", id: string): Promise<ApiResult<ExplorePlace>> {
  const result = await callBackend<BackendExplorable>("GET", `${kind === "trail" ? "trails" : "places"}/${id}`);
  return result.ok ? { ok: true, data: mapExplorable(result.data, kind) } : result;
}

export function setExploreSaved(kind: "place" | "trail", id: string, saved: boolean): Promise<ApiResult<unknown>> {
  return callBackend(saved ? "POST" : "DELETE", `${kind === "trail" ? "trails" : "places"}/${id}/save`);
}

function toSaved(place: ExplorePlace): SavedPlace {
  return {
    id: exploreKey(place),
    title: place.name,
    location: place.location,
    category: PLACE_CATEGORY_LABELS[place.category],
    href: place.kind === "trail" ? `/explore/trails/${place.id}` : `/explore/places/${place.id}`,
  };
}

/** The profile's "Saved places": bookmarked places and trails, newest first. */
export async function fetchSavedExplore(): Promise<ApiResult<SavedPlace[]>> {
  const [places, trails] = await Promise.all([
    fetchAll<BackendExplorable>("users/me/saved-places"),
    fetchAll<BackendExplorable>("users/me/saved-trails"),
  ]);
  if (!places.ok) return places;
  if (!trails.ok) return trails;
  return {
    ok: true,
    data: [
      ...places.data.map((raw) => toSaved(mapExplorable(raw, "place"))),
      ...trails.data.map((raw) => toSaved(mapExplorable(raw, "trail"))),
    ],
  };
}

export { toSaved as savedFromPlace };
