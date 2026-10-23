"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { fetchExplore, fetchExploreItem } from "@/lib/api/places";
import { PLACE_CATEGORY_LABELS, exploreKey } from "@/types/place";
import type { ExplorePlace } from "@/types/place";

type PlacePickerProps = {
  id: string;
  label: string;
  /** `exploreKey` of the selected place/trail ("place-3" / "trail-5"), if any. */
  value?: string;
  onChange: (place: ExplorePlace | undefined) => void;
  placeholder?: string;
};

const MAX_RESULTS = 8;

/**
 * Searchable picker for the real places and trails in the OUTLY backend (`places/` and
 * `trails/` with `?search=`). Selection is always optional. Keyboard: type to search, ↑/↓ to
 * move, Enter to choose, Esc to close.
 */
export function PlacePicker({ id, label, value, onChange, placeholder = "Search places and trails…" }: PlacePickerProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ExplorePlace[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<ExplorePlace>();
  const [reloadCount, setReloadCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // An existing link (editing an activity/event) is looked up by id so its name can be shown.
  useEffect(() => {
    if (!value) return;
    if (selected && exploreKey(selected) === value) return;
    const [kind, rawId] = value.split("-");
    if (kind !== "place" && kind !== "trail") return;
    let cancelled = false;
    void fetchExploreItem(kind, rawId).then((result) => {
      if (!cancelled && result.ok) setSelected(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [value, selected]);

  // Search the backend while the list is open (debounced).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus("loading");
      const result = await fetchExplore({ search: query });
      if (cancelled) return;
      if (result.ok) {
        setResults(result.data.slice(0, MAX_RESULTS));
        setActive(0);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    }, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, reloadCount]);

  function choose(place: ExplorePlace) {
    setSelected(place);
    setOpen(false);
    setQuery("");
    onChange(place);
  }

  function clear() {
    setSelected(undefined);
    onChange(undefined);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && results[active]) {
      event.preventDefault(); // choosing must not submit the surrounding form
      choose(results[active]);
    }
  }

  const showSelected = Boolean(value && selected && exploreKey(selected) === value);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--outly-ink)]">
        {label}
      </label>

      {showSelected && selected ? (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--outly-border)] bg-white px-4 py-2.5 shadow-[var(--shadow-soft)]">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--outly-ink)]">{selected.name}</p>
            <p className="truncate text-xs text-[var(--outly-muted)]">
              {PLACE_CATEGORY_LABELS[selected.category]} · {selected.location}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-[var(--outly-violet)] hover:bg-[var(--outly-lavender)]"
            aria-label={`Remove ${selected.name}`}
          >
            Remove
          </button>
        </div>
      ) : value && !selected ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--outly-border)] bg-white px-4 py-2.5 text-sm text-[var(--outly-muted)]">
          Loading the linked place…
        </p>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && results[active] ? `${listId}-opt-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            placeholder={placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--outly-border)] bg-white px-4 py-2.5 text-sm text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors focus:border-[var(--outly-violet)] focus:outline-none"
          />
          {open ? (
            <ul
              id={listId}
              role="listbox"
              aria-label={`${label} results`}
              className="mt-1 max-h-64 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--outly-border)] bg-white py-1 shadow-[var(--shadow-soft)]"
            >
              {status === "loading" && results.length === 0 ? (
                <li className="px-4 py-2 text-sm text-[var(--outly-muted)]" role="presentation">
                  Searching…
                </li>
              ) : status === "error" ? (
                <li className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-[#B3164C]" role="presentation">
                  Couldn&apos;t search places right now.
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setReloadCount((count) => count + 1)}
                    className="shrink-0 font-semibold text-[var(--outly-violet)]"
                  >
                    Try again
                  </button>
                </li>
              ) : results.length === 0 ? (
                <li className="px-4 py-2 text-sm text-[var(--outly-muted)]" role="presentation">
                  No places or trails match &ldquo;{query}&rdquo;.
                </li>
              ) : (
                results.map((place, index) => (
                  <li
                    key={exploreKey(place)}
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseDown={(event) => {
                      event.preventDefault(); // keep focus until the click is handled
                      choose(place);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={`flex cursor-pointer items-start gap-2 px-4 py-2 text-sm ${
                      index === active ? "bg-[var(--outly-lavender)]" : ""
                    }`}
                  >
                    <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--outly-violet)]" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[var(--outly-ink)]">{place.name}</span>
                      <span className="block truncate text-xs text-[var(--outly-muted)]">
                        {PLACE_CATEGORY_LABELS[place.category]} · {place.location}
                      </span>
                    </span>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
