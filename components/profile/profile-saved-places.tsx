"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { SavedPlace } from "@/types/profile";

type ProfileSavedPlacesProps = {
  places: SavedPlace[];
  onRemove: (placeId: string) => void;
};

/** Places/experiences the user saved, shown in the profile's "Saved
 * places" tab. Each item can be removed (updates shared context state)
 * and links through to a detail view when one exists. */
export function ProfileSavedPlaces({ places, onRemove }: ProfileSavedPlacesProps) {
  if (places.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-[var(--outly-muted)]">
        You haven&apos;t saved any places yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {places.map((place) => (
        <li
          key={place.id}
          className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-white p-4"
        >
          <div className="min-w-0">
            <p className="font-semibold text-[var(--outly-ink)]">{place.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--outly-muted)]">
              <Icon name="pin" className="h-3.5 w-3.5" />
              {place.location}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
              {place.category}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={place.href ?? "/explore"}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--outly-violet)] hover:bg-[var(--outly-lavender)]"
            >
              View
            </Link>
            <button
              type="button"
              onClick={() => onRemove(place.id)}
              aria-label={`Remove ${place.title} from saved places`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--outly-muted)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[#B3164C]"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
