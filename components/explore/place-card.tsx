"use client";

import Link from "next/link";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { StarRating } from "@/components/explore/star-rating";
import { SaveButton } from "@/components/social/save-button";
import { CoverImage } from "@/components/ui/cover-image";
import { Icon } from "@/components/ui/icon";
import { useSocialStore } from "@/context/social-store-context";
import { PHOTO_POSITIONS } from "@/lib/adventure-images";
import { cn } from "@/lib/utils";
import { PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS, exploreKey, exploreMeta, formatDistanceKm } from "@/types/place";
import type { ExplorePlace } from "@/types/place";

type PlaceCardProps = {
  place: ExplorePlace;
  /** What `place.distanceFromKm` is measured from ("your location", a place name). */
  distanceFrom?: string;
  /** A larger tile in the mosaic (spans more of the grid and shows the description). */
  featured?: boolean;
};

/**
 * Explore mosaic tile for a place or trail: the photo leads, with the category, rating, distance and
 * name over a dark gradient. The whole tile opens the place or trail's detail page; the save button is
 * the only separate control. Details are always visible, so touch screens need no hover. It shows the same
 * data as before (place data, distance from the chosen starting point, save state); only the presentation
 * is different, and it is used by Explore only.
 */
export function PlaceCard({ place, distanceFrom, featured = false }: PlaceCardProps) {
  const { isPlaceSaved, toggleSavePlace } = useSocialStore();
  const detailHref = place.kind === "trail" ? `/explore/trails/${place.id}` : `/explore/places/${place.id}`;
  const saved = isPlaceSaved(exploreKey(place));
  const photo = place.photo;

  return (
    <article
      className={cn(
        "group relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[var(--shadow-elevated)] focus-within:border-white/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        featured && "col-span-2 sm:row-span-2",
      )}
    >
      <div className="absolute inset-0 -z-10" style={{ backgroundImage: place.gradient }} aria-hidden="true">
        {photo ? (
          <CoverImage
            src={photo}
            position={PHOTO_POSITIONS[photo]}
            sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
          />
        ) : (
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 w-full opacity-70"
            viewBox="0 0 200 60"
            preserveAspectRatio="none"
          >
            <path d="M0 60 20 30 40 50 60 15 85 45 110 20 140 48 165 25 200 40 200 60Z" fill="rgba(255,255,255,0.16)" />
          </svg>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
      </div>

      <div className="absolute left-3 right-14 top-3 flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <Icon name={PLACE_CATEGORY_ICONS[place.category]} className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
          {PLACE_CATEGORY_LABELS[place.category]}
        </span>
        {place.verified ? (
          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <Icon name="shield-check" className="h-3 w-3 text-[var(--outly-pink)]" />
            Verified
          </span>
        ) : null}
      </div>

      <div className="absolute right-3 top-3 z-10 rounded-full bg-black/55 backdrop-blur">
        <SaveButton saved={saved} onToggle={() => toggleSavePlace(place)} />
      </div>

      {/* The grid rows set the tile height (see ExploreView), so nothing here can change the layout on hover. */}
      <div className={cn("absolute inset-0 flex flex-col justify-end gap-1.5 overflow-hidden p-4", featured && "sm:p-6")}>
        <Link
          href={detailHref}
          className="min-w-0 rounded-[var(--radius-sm)] after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <h3 className={cn("truncate font-semibold text-white", featured ? "text-2xl" : "text-base")}>{place.name}</h3>
        </Link>

        <p className="flex items-center gap-1 text-xs font-medium text-white/80">
          <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-[var(--outly-pink)]" />
          <span className="truncate">{place.location}</span>
        </p>

        {place.distanceFromKm !== undefined ? (
          <p className="text-xs font-semibold text-[var(--outly-pink)]">
            {formatDistanceKm(place.distanceFromKm)}
            {distanceFrom ? ` from ${distanceFrom}` : " away"}
          </p>
        ) : null}

        {/* Always shown on the large tile; on small tiles it appears on hover or focus (screen readers always get it). */}
        <p
          className={cn(
            "text-sm leading-relaxed text-white/80",
            featured
              ? "line-clamp-3"
              : "sr-only md:not-sr-only md:line-clamp-2 md:max-h-0 md:overflow-hidden md:opacity-0 md:transition-all md:duration-300 md:group-focus-within:max-h-12 md:group-hover:max-h-12 md:group-focus-within:opacity-100 md:group-hover:opacity-100 motion-reduce:md:transition-none",
          )}
        >
          {place.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-0.5">
          {place.difficulty ? <DifficultyBadge difficulty={place.difficulty} /> : null}
          {exploreMeta(place) ? <span className="text-xs text-white/75">{exploreMeta(place)}</span> : null}
        </div>

        <StarRating rating={place.rating} reviewCount={place.reviewCount} />
      </div>
    </article>
  );
}
