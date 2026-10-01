"use client";

import Link from "next/link";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { StarRating } from "@/components/explore/star-rating";
import { TrailRoutePreview } from "@/components/explore/trail-route-preview";
import { SaveButton } from "@/components/social/save-button";
import { Icon } from "@/components/ui/icon";
import { useSocialStore } from "@/context/social-store-context";
import { getExplorePlaceById } from "@/lib/mock/mock-places";
import { PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS } from "@/types/place";

type ExplorePlaceDetailViewProps = {
  placeId: string;
  /** Which screen this is rendering as — used only to pick the right
   * "not found" copy and to keep Place Detail and Trail Detail as
   * distinct routes even though they share this component. */
  expectedKind: "place" | "trail";
};

export function ExplorePlaceDetailView({ placeId, expectedKind }: ExplorePlaceDetailViewProps) {
  const { isPlaceSaved, toggleSavePlace } = useSocialStore();
  const place = getExplorePlaceById(placeId);
  const noun = expectedKind === "trail" ? "trail" : "place";

  if (!place || place.kind !== expectedKind) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">
          {noun === "trail" ? "Trail" : "Place"} not found
        </h1>
        <p className="text-sm text-[var(--outly-muted)]">
          This {noun} may have been removed, or the link is incorrect.
        </p>
        <Link
          href="/explore"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to Explore
        </Link>
      </div>
    );
  }

  const saved = isPlaceSaved(place.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/explore"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to Explore
      </Link>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)]">
        <div
          className="relative flex h-48 items-end overflow-hidden p-6 sm:h-64"
          style={{ backgroundImage: place.gradient }}
          role="img"
          aria-label={`${place.name} — illustrative terrain visual`}
        >
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-70"
            viewBox="0 0 200 60"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 60 20 30 40 50 60 15 85 45 110 20 140 48 165 25 200 40 200 60Z"
              fill="rgba(255,255,255,0.16)"
            />
          </svg>
          <span className="relative flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            <Icon name={PLACE_CATEGORY_ICONS[place.category]} className="h-3.5 w-3.5" />
            {PLACE_CATEGORY_LABELS[place.category]}
          </span>
          {place.verified ? (
            <span className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[var(--outly-purple-dark)]">
              <Icon name="shield-check" className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : null}
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
                {place.name}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[var(--outly-violet)]">
                <Icon name="pin" className="h-4 w-4" />
                {place.location}
              </p>
            </div>
            <SaveButton saved={saved} onToggle={() => toggleSavePlace(toSavedPlace(place))} />
          </div>

          <StarRating rating={place.rating} reviewCount={place.reviewCount} />

          <div className="flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={place.difficulty} />
            <span className="text-sm text-[var(--outly-muted)]">
              {place.distanceKm} km · {place.durationLabel}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-[var(--outly-ink)]">{place.description}</p>

          {place.kind === "trail" && place.routePoints ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
                Route preview
              </h2>
              <TrailRoutePreview routePoints={place.routePoints} />
            </div>
          ) : null}

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              Facilities
            </h2>
            <div className="flex flex-wrap gap-2">
              {place.facilities.map((facility) => (
                <span
                  key={facility}
                  className="rounded-full border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-3 py-1 text-xs font-medium text-[var(--outly-ink)]"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>

          {place.safetyNotes ? (
            <div className="flex gap-2 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[#fdf1d6] px-4 py-3">
              <Icon name="alert-circle" className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6a00]" />
              <p className="text-sm leading-relaxed text-[#9a6a00]">{place.safetyNotes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function toSavedPlace(place: NonNullable<ReturnType<typeof getExplorePlaceById>>) {
  return {
    id: place.id,
    title: place.name,
    location: place.location,
    category: PLACE_CATEGORY_LABELS[place.category],
  };
}
