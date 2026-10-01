"use client";

import Link from "next/link";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { StarRating } from "@/components/explore/star-rating";
import { SaveButton } from "@/components/social/save-button";
import { CoverImage } from "@/components/ui/cover-image";
import { Icon } from "@/components/ui/icon";
import { useSocialStore } from "@/context/social-store-context";
import { PLACE_PHOTOS } from "@/lib/adventure-images";
import { PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS } from "@/types/place";
import type { ExplorePlace } from "@/types/place";

type PlaceCardProps = {
  place: ExplorePlace;
};

/** Explore grid tile for a place or trail. Visual language matches
 * `ExperienceCard` (gradient banner + terrain silhouette) so Explore
 * reads as part of the same product as the landing page. */
export function PlaceCard({ place }: PlaceCardProps) {
  const { isPlaceSaved, toggleSavePlace } = useSocialStore();
  const detailHref = place.kind === "trail" ? `/explore/trails/${place.id}` : `/explore/places/${place.id}`;
  const saved = isPlaceSaved(place.id);
  const photo = PLACE_PHOTOS[place.id];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)] transition-all duration-200 group hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={detailHref} className="block">
        <div
          className="relative flex h-40 items-end overflow-hidden p-4 sm:h-44"
          style={{ backgroundImage: place.gradient }}
          role="img"
          aria-label={`${place.name} — illustrative terrain visual`}
        >
          {photo ? (
            <CoverImage src={photo} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
          ) : (
            <svg
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full opacity-70"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 60 20 30 40 50 60 15 85 45 110 20 140 48 165 25 200 40 200 60Z"
                fill="rgba(255,255,255,0.16)"
              />
            </svg>
          )}
          <span className="relative flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            <Icon name={PLACE_CATEGORY_ICONS[place.category]} className="h-3.5 w-3.5" />
            {PLACE_CATEGORY_LABELS[place.category]}
          </span>
          {place.verified ? (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[var(--outly-purple-dark)]">
              <Icon name="shield-check" className="h-3 w-3" />
              Verified
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <Link href={detailHref} className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-[var(--outly-ink)]">{place.name}</h3>
          </Link>
          <SaveButton saved={saved} onToggle={() => toggleSavePlace(toSavedPlace(place))} />
        </div>
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
          <Icon name="pin" className="h-3.5 w-3.5" />
          {place.location}
        </p>
        <p className="flex-1 text-sm leading-relaxed text-[var(--outly-muted)]">
          {place.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <DifficultyBadge difficulty={place.difficulty} />
          <span className="text-xs text-[var(--outly-muted)]">
            {place.distanceKm} km · {place.durationLabel}
          </span>
        </div>

        <StarRating rating={place.rating} reviewCount={place.reviewCount} className="pt-1" />
      </div>
    </article>
  );
}

function toSavedPlace(place: ExplorePlace) {
  return {
    id: place.id,
    title: place.name,
    location: place.location,
    category: PLACE_CATEGORY_LABELS[place.category],
  };
}
