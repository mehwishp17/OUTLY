"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { PlaceCard } from "@/components/explore/place-card";
import { Icon } from "@/components/ui/icon";
import { MOCK_PLACES } from "@/lib/mock/mock-places";
import type { Difficulty, PlaceCategory } from "@/types/place";

/** Explore Home: combines search, category/difficulty filters, and the
 * results grid on one screen (Search and Filters function as capabilities
 * of this screen rather than separate blank routes — matches "Search and
 * filters should work independently or together" from the Explore Module
 * requirements). A dedicated schematic Map view lives at `/explore/map`. */
export function ExploreView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return MOCK_PLACES.filter((place) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.location.toLowerCase().includes(normalizedQuery) ||
        place.description.toLowerCase().includes(normalizedQuery);

      const matchesCategory = category === "all" || place.category === category;
      const matchesDifficulty = difficulty === "all" || place.difficulty === difficulty;

      return matchesQuery && matchesCategory && matchesDifficulty;
    });
  }, [query, category, difficulty]);

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

      {filteredPlaces.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          No trails or places match your search and filters. Try clearing a filter.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}
