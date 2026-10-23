"use client";

import { useMemo, useState } from "react";
import { LeafletMap } from "@/components/explore/leaflet-map";
import type { MapMarker } from "@/components/explore/leaflet-map";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { straightLineKm } from "@/lib/geo";
import { useUserLocation } from "@/lib/use-user-location";
import { PLACE_CATEGORY_LABELS, formatDistanceKm } from "@/types/place";
import type { ExplorePlace } from "@/types/place";

const LOCATION_PROBLEMS = {
  denied: "Location access was blocked, so the distance can't be shown. You can allow it in your browser settings.",
  unavailable: "Your device couldn't work out a location (or location isn't supported here).",
  timeout: "Finding your location took too long. Try again.",
} as const;

const mapClasses =
  "isolate z-0 h-64 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--outly-border)] sm:h-80";

type LocationMapProps = {
  place: ExplorePlace;
};

/**
 * Detail-page map for a place or a trail: a real Leaflet map with a marker at the stored
 * coordinates (a trail's marker is its start point).
 *
 * A trail's full route is drawn only from `place.track`, which holds validated, recorded GPX
 * geometry. Nothing provides that yet, so trails show their start point and say the route isn't
 * available. The stored route points are never drawn: the seeded ones are generated, not recorded.
 *
 * The visitor's location is requested only when they press the button; it stays in memory and the
 * only thing shown is the straight-line distance to the marker.
 */
export function LocationMap({ place }: LocationMapProps) {
  const isTrail = place.kind === "trail";
  const noun = isTrail ? "trail" : "place";
  const hasCoordinates = place.latitude !== undefined && place.longitude !== undefined;
  const hasTrack = isTrail && (place.track?.length ?? 0) >= 2;

  const [ready, setReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const { state: location, request: requestLocation, reset: resetLocation } = useUserLocation();

  const markers = useMemo<MapMarker[]>(
    () =>
      hasCoordinates
        ? [
            {
              key: `${place.kind}-${place.id}`,
              lat: place.latitude as number,
              lng: place.longitude as number,
              title: place.name,
              subtitle: `${PLACE_CATEGORY_LABELS[place.category]} · ${place.location}`,
            },
          ]
        : [],
    [hasCoordinates, place.kind, place.id, place.latitude, place.longitude, place.name, place.category, place.location],
  );

  const distanceKm =
    hasCoordinates && location.status === "granted" && location.position
      ? straightLineKm(location.position, { lat: place.latitude as number, lng: place.longitude as number })
      : undefined;
  const problem =
    location.status === "denied" || location.status === "unavailable" || location.status === "timeout"
      ? location.status
      : undefined;

  const heading = (
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
      {isTrail ? "Map" : "Location"}
    </h2>
  );

  if (!hasCoordinates) {
    return (
      <div>
        {heading}
        <p className="rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-4 py-3 text-sm text-[var(--outly-muted)]">
          This {noun} doesn&apos;t have map coordinates yet
          {place.location ? <>, so it can&apos;t be shown on a map. It&apos;s listed as {place.location}.</> : "."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {heading}

      {mapFailed ? (
        <p role="alert" className="rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-4 py-3 text-sm text-[var(--outly-muted)]">
          The map couldn&apos;t be started. {place.location ? `This ${noun} is listed as ${place.location}.` : ""}
        </p>
      ) : (
        <div className="relative">
          <LeafletMap
            markers={markers}
            route={hasTrack ? place.track : undefined}
            singleMarkerZoom={13}
            onReady={() => setReady(true)}
            onError={() => setMapFailed(true)}
            onTilesFailed={() => setTilesFailed(true)}
            label={`Map showing ${place.name}`}
            className={mapClasses}
          />
          {!ready ? (
            <div
              role="status"
              className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--outly-lavender)] text-sm text-[var(--outly-muted)]"
            >
              Loading the map…
            </div>
          ) : null}
        </div>
      )}

      {tilesFailed && !mapFailed ? (
        <p role="alert" className="mt-2 text-sm text-[#B3164C]">
          The map images couldn&apos;t be loaded. The marker position is still correct
          ({place.latitude?.toFixed(4)}, {place.longitude?.toFixed(4)}).
        </p>
      ) : null}

      <p className="mt-2 text-xs text-[var(--outly-muted)]">
        {isTrail
          ? hasTrack
            ? "The line shows the recorded route from its start (green) to its end (pink)."
            : "The full route for this trail isn't available yet. The marker shows the trail's start point."
          : "The marker shows this place's location."}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={requestLocation} disabled={location.status === "requesting"}>
            <Icon name="pin" className="h-4 w-4" />
            {location.status === "requesting" ? "Finding your location…" : "Show distance from my location"}
          </Button>
          {location.status === "granted" ? (
            <button
              type="button"
              onClick={resetLocation}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-muted)] hover:text-[#b3164c]"
            >
              Clear
            </button>
          ) : null}
        </div>

        {problem ? (
          <p role="alert" className="text-sm text-[#B3164C]">
            {LOCATION_PROBLEMS[problem]}
          </p>
        ) : null}

        {distanceKm !== undefined ? (
          <p role="status" className="text-sm text-[var(--outly-ink)]">
            <span className="font-semibold">About {formatDistanceKm(distanceKm)}</span> in a straight line from your
            location to {isTrail ? "the start of this trail" : "this place"}. This is not a driving distance or travel
            time{isTrail ? ", and it is separate from the trail's own length listed above" : ""}.
          </p>
        ) : (
          <p className="text-xs text-[var(--outly-muted)]">
            Your location is only used when you press the button, and isn&apos;t saved.
          </p>
        )}
      </div>
    </div>
  );
}
