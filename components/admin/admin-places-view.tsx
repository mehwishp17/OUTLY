"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { StarRating } from "@/components/explore/star-rating";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { setPlaceVerifiedRequest } from "@/lib/api/admin";
import { fetchExplore } from "@/lib/api/places";
import { PLACE_CATEGORY_LABELS } from "@/types/place";
import type { ExplorePlace } from "@/types/place";

/** Admin Places (administrators): every place and trail from the Explore
 * module, with a verification toggle — reuses `DifficultyBadge`/`StarRating`
 * from Explore rather than duplicating that presentation. */
export function AdminPlacesView() {
  const [places, setPlaces] = useState<ExplorePlace[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void fetchExplore().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setPlaces(result.data);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleVerified(place: ExplorePlace, verified: boolean) {
    setActionError(undefined);
    const result = await setPlaceVerifiedRequest(place.kind, place.id, verified);
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    setPlaces((current) =>
      current.map((candidate) =>
        candidate.id === place.id && candidate.kind === place.kind ? { ...candidate, verified } : candidate,
      ),
    );
  }

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

      {actionError ? (
        <p role="alert" className="text-sm text-[#B3164C]">
          {actionError}
        </p>
      ) : null}

      {status === "loading" ? (
        <LoadingState message="Loading places…" />
      ) : status === "error" ? (
        <ErrorState title="We couldn't load places" description={error} />
      ) : (
      <ul className="flex flex-col gap-2">
        {places.map((place) => {
          const verified = place.verified;
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
                  {place.difficulty ? <DifficultyBadge difficulty={place.difficulty} /> : null}
                  <StarRating rating={place.rating} reviewCount={place.reviewCount} />
                </div>
              </div>

              <Button
                size="md"
                variant="secondary"
                onClick={() => toggleVerified(place, !verified)}
              >
                {verified ? "Remove verification" : "Mark verified"}
              </Button>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}
