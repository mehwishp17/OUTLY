"use client";

import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { StarRating } from "@/components/explore/star-rating";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAdminStore } from "@/context/admin-store-context";
import { MOCK_PLACES } from "@/lib/mock/mock-places";
import { PLACE_CATEGORY_LABELS } from "@/types/place";

/** Admin Places: every place and trail from the Explore module, with a
 * verification toggle — reuses `DifficultyBadge`/`StarRating` from
 * Explore rather than duplicating that presentation. */
export function AdminPlacesView() {
  const { isPlaceVerified, setPlaceVerified } = useAdminStore();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Places
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Every place and trail listed on Explore.
        </p>
      </div>

      <AdminNav active="/admin/places" />

      <ul className="flex flex-col gap-2">
        {MOCK_PLACES.map((place) => {
          const verified = isPlaceVerified(place.id, place.verified);
          const detailHref = place.kind === "trail" ? `/explore/trails/${place.id}` : `/explore/places/${place.id}`;

          return (
            <li
              key={place.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={detailHref}
                    className="truncate text-sm font-semibold text-[var(--outly-ink)] hover:text-[var(--outly-violet)]"
                  >
                    {place.name}
                  </Link>
                  {verified ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-xs font-semibold text-[#1e7a3a]">
                      <Icon name="shield-check" className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-[var(--outly-lavender)] px-2 py-0.5 text-xs font-semibold text-[var(--outly-muted)]">
                      Unverified
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--outly-muted)]">
                  {PLACE_CATEGORY_LABELS[place.category]} · {place.location}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <DifficultyBadge difficulty={place.difficulty} />
                  <StarRating rating={place.rating} reviewCount={place.reviewCount} />
                </div>
              </div>

              <Button
                size="md"
                variant="secondary"
                onClick={() => setPlaceVerified(place.id, place.name, !verified)}
              >
                {verified ? "Remove verification" : "Mark verified"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
