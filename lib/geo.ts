const EARTH_RADIUS_KM = 6371.0088;

export type GeoPoint = { lat: number; lng: number };

/**
 * Great-circle ("as the crow flies") distance in km between two coordinates. It is not a
 * driving, walking or cycling distance and says nothing about travel time.
 */
export function straightLineKm(a: GeoPoint, b: GeoPoint): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
