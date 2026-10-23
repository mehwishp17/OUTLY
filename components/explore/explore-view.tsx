"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { PlaceCard } from "@/components/explore/place-card";
import { PlacePicker } from "@/components/explore/place-picker";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { ChipButton } from "@/components/ui/chip-button";
import { ErrorState } from "@/components/ui/error-state";
import { fetchExplore } from "@/lib/api/places";
import { useUserLocation } from "@/lib/use-user-location";
import { exploreKey } from "@/types/place";
import type { Difficulty, ExplorePlace, PlaceCategory } from "@/types/place";

const RADIUS_OPTIONS_KM = [10, 25, 50, 100];

// Image-led mosaic: fixed row heights keep tiles steady; the first tile is larger (see PlaceCard `featured`).
const GRID = "grid grid-flow-dense auto-rows-[15rem] grid-cols-2 gap-3 sm:auto-rows-[16rem] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4";

const LOCATION_PROBLEMS = {
  denied:
    "Location access was blocked, so we can't find places near you. You can allow it in your browser settings, or pick a place below to browse around it.",
  unavailable:
    "Your device couldn't work out a location (or location isn't supported here). Pick a place below to browse around it instead.",
  timeout: "Finding your location took too long. Try again, or pick a place below to browse around it.",
} as const;

type Center = { lat: number; lng: number; label: string };

/** Explore Home: combines search, category/difficulty filters, and the
 * results grid on one screen (Search and Filters function as capabilities
 * of this screen rather than separate blank routes — matches "Search and
 * filters should work independently or together" from the Explore Module
 * requirements). "Near me" uses the browser location only after the person
 * clicks it; otherwise a place or trail can be chosen as the starting point.
 * A map view lives at `/explore/map`. */
export function ExploreView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");

  const { state: location, request: requestLocation, reset: resetLocation } = useUserLocation();
  const [manualPlace, setManualPlace] = useState<ExplorePlace>();
  const [showManual, setShowManual] = useState(false);
  const [radiusKm, setRadiusKm] = useState(50);

  // Where "nearby" is measured from: a place the person picked, or their own location.
  const center: Center | undefined =
    manualPlace && manualPlace.latitude !== undefined && manualPlace.longitude !== undefined
      ? { lat: manualPlace.latitude, lng: manualPlace.longitude, label: manualPlace.name }
      : location.status === "granted" && location.position
        ? { ...location.position, label: "your location" }
        : undefined;
  const nearKey = center ? `${center.lat},${center.lng},${radiusKm}` : "";

  // `loaded.nearKey` records which query produced the results, so results are never
  // presented as "nearby" (or as a plain list) for a query they didn't answer.
  const [loaded, setLoaded] = useState<{ places: ExplorePlace[]; nearKey: string }>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [reloadCount, setReloadCount] = useState(0);

  // Search, filters and distance are applied by the backend; typing is debounced.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus("loading");
      const result = await fetchExplore({
        search: query,
        category,
        difficulty,
        near: center ? { lat: center.lat, lng: center.lng, radiusKm } : undefined,
      });
      if (cancelled) return;
      if (result.ok) {
        setLoaded({ places: result.data, nearKey });
        setError(undefined);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    }, query ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `center` is derived from `nearKey`; depending on the key keeps the effect stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, difficulty, reloadCount, nearKey]);

  const current = loaded && loaded.nearKey === nearKey ? loaded.places : undefined;
  const problem = location.status === "denied" || location.status === "unavailable" || location.status === "timeout" ? location.status : undefined;
  const manualVisible = showManual || Boolean(problem);

  function handleNearMe() {
    setManualPlace(undefined);
    requestLocation();
  }

  function handleClearNearby() {
    resetLocation();
    setManualPlace(undefined);
    setShowManual(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Explore
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            Discover trails, viewpoints, campsites, and routes worth the trip.
          </p>
        </div>
        <Link
          href="/explore/map"
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--outly-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--outly-violet)]/60"
        >
          <Icon name="map" className="h-4 w-4" />
          View on map
        </Link>
      </div>

      <ExploreFilters
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
      />

      <section
        aria-label="Nearby places"
        className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={handleNearMe} disabled={location.status === "requesting"}>
            <Icon name="pin" className="h-4 w-4" />
            {location.status === "requesting" ? "Finding your location…" : "Near me"}
          </Button>
          <button
            type="button"
            onClick={() => setShowManual((visible) => !visible)}
            aria-expanded={manualVisible}
            className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-violet)] hover:bg-[var(--outly-lavender)]"
          >
            Browse around a place
          </button>
          {center ? (
            <>
              <span className="ml-auto hidden text-xs font-semibold text-[var(--outly-muted)] sm:inline">Within</span>
              <div role="group" aria-label="Search radius" className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS_KM.map((option) => (
                  <ChipButton key={option} active={radiusKm === option} onClick={() => setRadiusKm(option)}>
                    {option} km
                  </ChipButton>
                ))}
              </div>
              <button
                type="button"
                onClick={handleClearNearby}
                className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-muted)] hover:text-[#b3164c]"
              >
                Clear
              </button>
            </>
          ) : null}
        </div>

        {problem ? (
          <p role="alert" className="text-sm text-[#B3164C]">
            {LOCATION_PROBLEMS[problem]}
          </p>
        ) : null}

        {manualVisible ? (
          <div className="max-w-md">
            <PlacePicker
              id="explore-around-place"
              label="Browse around a place or trail"
              placeholder="Search a place or trail to start from…"
              value={manualPlace ? exploreKey(manualPlace) : undefined}
              onChange={(place) => {
                setManualPlace(place);
                if (place) resetLocation();
              }}
            />
            {manualPlace && !center ? (
              <p role="alert" className="mt-2 text-sm text-[#B3164C]">
                {manualPlace.name} has no coordinates yet, so results can&apos;t be measured from it. Choose another place.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {status === "error" ? (
        <ErrorState
          title={center ? "We couldn't load nearby places" : "We couldn't load Explore"}
          description={error}
          action={
            <Button variant="secondary" onClick={() => setReloadCount((count) => count + 1)}>
              Try again
            </Button>
          }
        />
      ) : !current ? (
        <div role="status">
          <span className="sr-only">{center ? "Finding places and trails near you…" : "Loading places and trails…"}</span>
          <div aria-hidden="true" className={GRID}>
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <div
                key={key}
                className={`animate-pulse rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.06] motion-reduce:animate-none ${key === 0 ? "col-span-2 sm:row-span-2" : ""}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {center ? (
            <p role="status" className="text-sm text-[var(--outly-muted)]">
              {current.length === 0
                ? `No places or trails within ${radiusKm} km of ${center.label}.`
                : `${current.length} ${current.length === 1 ? "place or trail" : "places and trails"} within ${radiusKm} km of ${center.label}, nearest first.`}
            </p>
          ) : null}
          {current.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
              {center
                ? "Try a larger radius, change the filters, or clear the location to see everything."
                : "No trails or places match your search and filters. Try clearing a filter."}
            </p>
          ) : (
            <div aria-busy={status === "loading"} className={`${GRID} ${status === "loading" ? "opacity-60" : ""}`}>
              {current.map((place, index) => (
                <PlaceCard
                  key={exploreKey(place)}
                  place={place}
                  distanceFrom={center?.label}
                  featured={current.length > 3 && index % 9 === 0}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
