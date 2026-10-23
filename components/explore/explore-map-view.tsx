"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeafletMap } from "@/components/explore/leaflet-map";
import type { MapMarker } from "@/components/explore/leaflet-map";
import { Icon } from "@/components/ui/icon";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { fetchExplore } from "@/lib/api/places";
import { PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS, exploreKey } from "@/types/place";
import type { ExplorePlace } from "@/types/place";

const detailHref = (place: ExplorePlace) =>
  place.kind === "trail" ? `/explore/trails/${place.id}` : `/explore/places/${place.id}`;

/**
 * Explore map: a real, zoomable/pannable map (`LeafletMap`) with one marker per place or trail
 * at its actual coordinates (a trail's marker is its start point). A plain list is always shown
 * alongside it as the non-map alternative required by the accessibility guidelines.
 */
export function ExploreMapView() {
  const router = useRouter();
  const [places, setPlaces] = useState<ExplorePlace[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [focus, setFocus] = useState<{ key: string; n: number }>();
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchExplore().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setPlaces(result.data);
        setError(undefined);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const markers = useMemo<MapMarker[]>(
    () =>
      places.flatMap((place) =>
        place.latitude !== undefined && place.longitude !== undefined
          ? [
              {
                key: exploreKey(place),
                lat: place.latitude,
                lng: place.longitude,
                title: place.name,
                subtitle: `${PLACE_CATEGORY_LABELS[place.category]} · ${place.location}`,
                href: detailHref(place),
              },
            ]
          : [],
      ),
    [places],
  );
  const withoutCoordinates = places.length - markers.length;

  if (status === "loading") return <LoadingState message="Loading the map…" />;
  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <ErrorState title="We couldn't load the map" description={error} />
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            setReloadCount((count) => count + 1);
          }}
          className="mt-3 text-sm font-semibold text-[var(--outly-violet)]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Explore map
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            Every pin is at the real location of a trail or place. Select a pin for details.
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--outly-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--outly-violet)]/60"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to Explore
        </Link>
      </div>

      {places.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          There are no trails or places to show on the map yet.
        </p>
      ) : (
        <LeafletMap
          markers={markers}
          focus={focus}
          onNavigate={(href) => router.push(href)}
          label="Map of trails and places"
          className="isolate z-0 h-80 w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] shadow-[var(--shadow-soft)] sm:h-96"
        />
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
          All locations
        </h2>
        {withoutCoordinates > 0 ? (
          <p className="mt-2 text-xs text-[var(--outly-muted)]">
            {withoutCoordinates} {withoutCoordinates === 1 ? "item has" : "items have"} no coordinates yet and
            {withoutCoordinates === 1 ? " is" : " are"} listed here but not on the map.
          </p>
        ) : null}
        <ul className="mt-3 divide-y divide-[var(--outly-border)]">
          {places.map((place) => {
            const key = exploreKey(place);
            const onMap = markers.some((marker) => marker.key === key);
            return (
              <li key={key} className="flex items-center gap-3 py-3">
                <Link
                  href={detailHref(place)}
                  className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-[var(--outly-violet)]"
                >
                  <Icon name={PLACE_CATEGORY_ICONS[place.category]} className="h-4.5 w-4.5 shrink-0 text-[var(--outly-violet)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--outly-ink)]">{place.name}</span>
                    <span className="block text-xs text-[var(--outly-muted)]">
                      {PLACE_CATEGORY_LABELS[place.category]} · {place.location}
                    </span>
                  </span>
                </Link>
                {onMap ? (
                  <button
                    type="button"
                    onClick={() => setFocus((current) => ({ key, n: (current?.n ?? 0) + 1 }))}
                    className="shrink-0 rounded-full border border-[var(--outly-border)] px-3 py-1 text-xs font-semibold text-[var(--outly-violet)] hover:border-[var(--outly-violet)]/60"
                    aria-label={`Show ${place.name} on the map`}
                  >
                    Show on map
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
