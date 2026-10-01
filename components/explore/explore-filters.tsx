"use client";

import { ChipButton } from "@/components/ui/chip-button";
import { Icon } from "@/components/ui/icon";
import { DIFFICULTY_LABELS, PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS } from "@/types/place";
import type { Difficulty, PlaceCategory } from "@/types/place";

const CATEGORY_OPTIONS = Object.keys(PLACE_CATEGORY_LABELS) as PlaceCategory[];
const DIFFICULTY_OPTIONS = Object.keys(DIFFICULTY_LABELS) as Difficulty[];

type ExploreFiltersProps = {
  query: string;
  onQueryChange: (query: string) => void;
  category: PlaceCategory | "all";
  onCategoryChange: (category: PlaceCategory | "all") => void;
  difficulty: Difficulty | "all";
  onDifficultyChange: (difficulty: Difficulty | "all") => void;
};

/** Search input + category/difficulty filter chips for Explore Home.
 * Search and filters can be used independently or together (per the
 * Explore Module requirements) — all combine with simple AND logic in
 * the parent view. */
export function ExploreFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
}: ExploreFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--outly-muted)]"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search trails, places, or destinations…"
          aria-label="Search trails and places"
          className="w-full rounded-full border border-[var(--outly-border)] bg-white py-3 pl-11 pr-4 text-sm text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors placeholder:text-[var(--outly-muted)]/70 focus:border-[var(--outly-violet)] focus:outline-none"
        />
      </div>

      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        <ChipButton active={category === "all"} onClick={() => onCategoryChange("all")}>
          All
        </ChipButton>
        {CATEGORY_OPTIONS.map((option) => (
          <ChipButton
            key={option}
            active={category === option}
            onClick={() => onCategoryChange(option)}
          >
            <Icon name={PLACE_CATEGORY_ICONS[option]} className="h-3.5 w-3.5" />
            {PLACE_CATEGORY_LABELS[option]}
          </ChipButton>
        ))}
      </div>

      <div role="group" aria-label="Filter by difficulty" className="flex flex-wrap gap-2">
        <ChipButton active={difficulty === "all"} onClick={() => onDifficultyChange("all")}>
          Any difficulty
        </ChipButton>
        {DIFFICULTY_OPTIONS.map((option) => (
          <ChipButton
            key={option}
            active={difficulty === option}
            onClick={() => onDifficultyChange(option)}
          >
            {DIFFICULTY_LABELS[option]}
          </ChipButton>
        ))}
      </div>
    </div>
  );
}
