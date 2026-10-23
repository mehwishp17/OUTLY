import { callBackend, fetchAll } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { SavedPlace } from "@/types/profile";
import { PLACE_CATEGORY_LABELS, exploreKey } from "@/types/place";
import type { Difficulty, ExplorePlace, PlaceCategory } from "@/types/place";

/**
 * Explore client (places + trails), reached through `/api/backend/*`:
 *
 *   GET places/?search=&category=&difficulty=&near=lat,lng&radius_km=&ordering=nearest   list / search / filter / nearby
 *       (nearby results carry `distance_from_km`; trails are matched on their start point)
 *   GET places/{id}/ , trails/{id}/                                detail (a trail's stored route points are not
 *       drawn: the seeded ones are generated, not recorded, and nothing yet marks recorded GPX geometry)
 *   POST/DELETE places/{id}/save/ , trails/{id}/save/              bookmark
 *   GET users/me/saved-places/ , users/me/saved-trails/            my bookmarks
 */

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
  /** Distance from the request's `near` point, present only on nearby queries. */
  distance_from_km?: number | null;
  /** Places */
  coordinates?: { latitude: number; longitude: number };
  /** Trails */
  start?: { latitude: number; longitude: number } | null;
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

function coordinatesOf(raw: BackendExplorable): { lat: number; lng: number } | undefined {
  const c = raw.coordinates ?? raw.start;
  return c ? { lat: Number(c.latitude), lng: Number(c.longitude) } : undefined;
}

export function mapExplorable(raw: BackendExplorable, kind: "place" | "trail"): ExplorePlace {
  const category = CATEGORIES.includes(raw.category as PlaceCategory) ? (raw.category as PlaceCategory) : "trail";
  const difficulty = raw.difficulty?.toLowerCase() as Difficulty | undefined;
  const photo = raw.images?.find((image) => image.startsWith("/"));
  const point = coordinatesOf(raw);
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
    latitude: point?.lat,
    longitude: point?.lng,
    distanceFromKm: typeof raw.distance_from_km === "number" ? raw.distance_from_km : undefined,
  };
}

export type NearPoint = { lat: number; lng: number; radiusKm: number };

export type ExploreQuery = {
  search?: string;
  category?: PlaceCategory | "all";
  difficulty?: Difficulty | "all";
  /** Only items within `radiusKm` of this point, nearest first, with `distanceFromKm` set. */
  near?: NearPoint;
};

function queryString(query: ExploreQuery): string {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.difficulty && query.difficulty !== "all") params.set("difficulty", query.difficulty.toUpperCase());
  if (query.near) {
    params.set("near", `${query.near.lat},${query.near.lng}`);
    params.set("radius_km", String(query.near.radiusKm));
    params.set("ordering", "nearest");
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** Places and trails matching the search/filters (the server does the filtering).
 * With `near`, only items inside the radius are returned, nearest first; otherwise A–Z. */
export async function fetchExplore(query: ExploreQuery = {}): Promise<ApiResult<ExplorePlace[]>> {
  const qs = queryString(query);
  const [places, trails] = await Promise.all([
    fetchAll<BackendExplorable>(`places${qs}`),
    fetchAll<BackendExplorable>(`trails${qs}`),
  ]);
  if (!places.ok) return places;
  if (!trails.ok) return trails;
  const merged = [
    ...places.data.map((raw) => mapExplorable(raw, "place")),
    ...trails.data.map((raw) => mapExplorable(raw, "trail")),
  ];
  const byDistance = (a: ExplorePlace, b: ExplorePlace) =>
    (a.distanceFromKm ?? Infinity) - (b.distanceFromKm ?? Infinity) || a.name.localeCompare(b.name);
  return { ok: true, data: merged.sort(query.near ? byDistance : (a, b) => a.name.localeCompare(b.name)) };
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

/* ---------------------------------------------------------------------- */
/* Naming the user's current position (used by the Location form field)   */
/* ---------------------------------------------------------------------- */

export type PositionName =
  | { ok: true; name: string; source: "nearby" | "reverse" }
  | { ok: false; reason: "none" | "error" };

/** A saved place or trail this close counts as "where you are". */
const NEARBY_RADIUS_KM = 5;
const REVERSE_GEOCODE_URL = process.env.NEXT_PUBLIC_REVERSE_GEOCODE_URL || "https://nominatim.openstreetmap.org/reverse";
/** Session-only cache keyed by rounded coordinates, so a repeated click never repeats the lookup. */
const reverseCache = new Map<string, string>();

/**
 * City/town name for coordinates via an OpenStreetMap-compatible reverse geocoder (Nominatim by
 * default: free, no API key). It is only called from an explicit "Use my current location" click, once
 * per click, and the browser's Referer identifies the app, as the Nominatim usage policy requires.
 * The public server is meant for light use: point `NEXT_PUBLIC_REVERSE_GEOCODE_URL` at a hosted or
 * self-run instance before production traffic.
 */
async function reverseGeocode(lat: number, lng: number): Promise<PositionName> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = reverseCache.get(key);
  if (cached) return { ok: true, name: cached, source: "reverse" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `${REVERSE_GEOCODE_URL}?format=jsonv2&zoom=10&addressdetails=1&accept-language=en&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) return { ok: false, reason: "error" };
    const data = (await response.json()) as { address?: Record<string, string> };
    const a = data.address ?? {};
    const place = a.city || a.town || a.village || a.municipality || a.suburb || a.county || a.state_district;
    if (!place) return { ok: false, reason: "none" };
    const name = a.state && a.state !== place ? `${place}, ${a.state}` : place;
    reverseCache.set(key, name);
    return { ok: true, name, source: "reverse" };
  } catch {
    return { ok: false, reason: "error" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A readable location for the given coordinates: the closest saved OUTLY place or trail within
 * 5 km (its location text), otherwise the city/town from reverse geocoding. Coordinates are never
 * stored or put in the form: only the resolved name is.
 */
export async function nameForPosition(lat: number, lng: number): Promise<PositionName> {
  const nearby = await fetchExplore({ near: { lat, lng, radiusKm: NEARBY_RADIUS_KM } });
  if (nearby.ok) {
    const closest = nearby.data.find((item) => (item.location || item.name).trim() !== "");
    if (closest) return { ok: true, name: (closest.location || closest.name).trim(), source: "nearby" };
  }
  // No saved place here (or our API is unavailable): fall back to naming the city/town.
  return reverseGeocode(lat, lng);
}
