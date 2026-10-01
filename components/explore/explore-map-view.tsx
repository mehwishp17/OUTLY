"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { MOCK_PLACES } from "@/lib/mock/mock-places";
import { PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS } from "@/types/place";

/**
 * Schematic (not geographically accurate) map view. There is no real map
 * provider/API key wired up in this frontend-only phase, so pins are
 * placed on an illustrative canvas using each place's `mapPosition`
 * percentage. A plain linked list is always shown alongside it as the
 * non-map alternative required by the Frontend Responsive & Accessibility
 * guidelines ("Map interactions should have non-map alternatives").
 */
export function ExploreMapView() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Explore map
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            An illustrative overview of where each trail and place sits relative to the others.
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

      <div
        role="img"
        aria-label="Schematic map of trails and places — see the list below for an accessible, non-visual alternative."
        className="relative h-80 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] shadow-[var(--shadow-soft)] sm:h-96"
      >
        <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
          <defs>
            <pattern id="explore-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--outly-border)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#explore-map-grid)" />
        </svg>

        {MOCK_PLACES.map((place) => {
          const detailHref =
            place.kind === "trail" ? `/explore/trails/${place.id}` : `/explore/places/${place.id}`;
          return (
            <Link
              key={place.id}
              href={detailHref}
              aria-hidden="true"
              tabIndex={-1}
              title={place.name}
              style={{ left: `${place.mapPosition.x}%`, top: `${place.mapPosition.y}%` }}
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-[var(--shadow-elevated)] transition-transform hover:scale-110 gradient-brand motion-reduce:transition-none"
            >
              <Icon name={PLACE_CATEGORY_ICONS[place.category]} className="h-4 w-4" />
            </Link>
          );
        })}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
          All locations
        </h2>
        <ul className="mt-3 divide-y divide-[var(--outly-border)]">
          {MOCK_PLACES.map((place) => {
            const detailHref =
              place.kind === "trail" ? `/explore/trails/${place.id}` : `/explore/places/${place.id}`;
            return (
              <li key={place.id}>
                <Link
                  href={detailHref}
                  className="flex items-center gap-3 py-3 transition-colors hover:text-[var(--outly-violet)]"
                >
                  <Icon name={PLACE_CATEGORY_ICONS[place.category]} className="h-4.5 w-4.5 shrink-0 text-[var(--outly-violet)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--outly-ink)]">
                      {place.name}
                    </span>
                    <span className="block text-xs text-[var(--outly-muted)]">
                      {PLACE_CATEGORY_LABELS[place.category]} · {place.location}
                    </span>
                  </span>
                  <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-[var(--outly-muted)]" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
