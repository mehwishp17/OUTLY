"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { FormError } from "@/components/ui/form-error";
import { Label } from "@/components/ui/label";
import { fetchExplore, nameForPosition } from "@/lib/api/places";
import type { PositionName } from "@/lib/api/places";
import { useUserLocation } from "@/lib/use-user-location";
import { PLACE_CATEGORY_LABELS, exploreKey } from "@/types/place";
import type { ExplorePlace } from "@/types/place";

type LocationFieldProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  /** Longest value the destination accepts (e.g. the profile location is capped at 120). Suggestions and the
   * current-location name are cut to fit; omit for no limit. */
  maxLength?: number;
};

const MAX_RESULTS = 8;
const MIN_QUERY = 2;

const LOCATION_PROBLEMS = {
  denied: "Location access was blocked. You can allow it in your browser settings, or search or type a location instead.",
  unavailable: "Your device couldn't work out a location. Search or type a location instead.",
  timeout: "Finding your location took too long. Try again, or search or type a location instead.",
} as const;

/**
 * The required Location field with autocomplete and a "Use my current location" action.
 *
 * - Suggestions are the real places and trails in the OUTLY backend (`places/` + `trails/` with
 *   `?search=`). Picking one fills this field with its location text; typing freely is always allowed.
 * - It never links a place or trail: the separate optional picker does that.
 * - Browser geolocation runs only after the explicit click. The coordinates are used once to find a
 *   readable name and are never stored or placed in the form.
 */
export function LocationField({ id, label = "Location", value, onChange, error, placeholder, required, maxLength }: LocationFieldProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // ---- autocomplete ----
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ExplorePlace[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [active, setActive] = useState(-1);
  const [reloadCount, setReloadCount] = useState(0);
  const query = value.trim();
  const searching = open && query.length >= MIN_QUERY;

  useEffect(() => {
    if (!searching) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus("loading");
      const result = await fetchExplore({ search: query });
      if (cancelled) return;
      if (result.ok) {
        setResults(result.data.slice(0, MAX_RESULTS));
        setActive(-1);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searching, query, reloadCount]);

  // Click or tap outside closes the list.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  function choose(place: ExplorePlace) {
    const text = (place.location || place.name).trim();
    onChange(maxLength ? text.slice(0, maxLength) : text);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown" && searching) {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp" && searching) {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && searching && active >= 0 && results[active]) {
      event.preventDefault(); // choosing a suggestion must not submit the form
      choose(results[active]);
    }
  }

  // ---- current location ----
  const { state: geo, request: requestGeo, reset: resetGeo } = useUserLocation();
  const [lookup, setLookup] = useState<{ key: string; result: PositionName }>();
  const positionKey = geo.status === "granted" && geo.position ? `${geo.position.lat},${geo.position.lng}` : undefined;

  useEffect(() => {
    if (!positionKey || !geo.position) return;
    const { lat, lng } = geo.position;
    let cancelled = false;
    void nameForPosition(lat, lng).then((result) => {
      if (cancelled) return;
      setLookup({ key: positionKey, result });
      if (result.ok) onChangeRef.current(maxLength ? result.name.slice(0, maxLength) : result.name);
    });
    return () => {
      cancelled = true;
    };
    // `geo.position` is fully described by `positionKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionKey]);

  const lookupDone = Boolean(positionKey && lookup?.key === positionKey);
  const requesting = geo.status === "requesting";
  const resolving = Boolean(positionKey) && !lookupDone;
  const busy = requesting || resolving;
  const problem = geo.status === "denied" || geo.status === "unavailable" || geo.status === "timeout" ? geo.status : undefined;

  function handleUseCurrentLocation() {
    setLookup(undefined);
    setOpen(false);
    resetGeo();
    requestGeo();
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
    setOpen(true);
    setActive(-1);
    if (geo.status !== "idle") {
      resetGeo(); // the person is typing their own location: drop the previous location message
      setLookup(undefined);
    }
  }

  const errorId = error ? `${id}-error` : undefined;

  return (
    <div ref={containerRef} className="space-y-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={searching}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={searching && active >= 0 ? `${listId}-opt-${active}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          autoComplete="off"
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-[var(--radius-sm)] border bg-white px-4 py-2.5 text-sm text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors placeholder:text-[var(--outly-muted)]/70 focus:outline-none ${
            error ? "border-[#B3164C] focus:border-[#B3164C]" : "border-[var(--outly-border)] focus:border-[var(--outly-violet)]"
          }`}
        />

        {searching ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--outly-border)] bg-white py-1 shadow-[var(--shadow-elevated)]"
          >
            {status === "error" ? (
              <li role="presentation" className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-[#B3164C]">
                Couldn&apos;t load suggestions right now.
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setReloadCount((count) => count + 1)}
                  className="shrink-0 font-semibold text-[var(--outly-violet)]"
                >
                  Try again
                </button>
              </li>
            ) : status !== "ready" ? (
              <li role="presentation" className="px-4 py-2 text-sm text-[var(--outly-muted)]">
                Searching places…
              </li>
            ) : results.length === 0 ? (
              <li role="presentation" className="px-4 py-2 text-sm text-[var(--outly-muted)]">
                No saved places match &ldquo;{query}&rdquo;. You can keep what you typed.
              </li>
            ) : (
              results.map((place, index) => (
                <li
                  key={exploreKey(place)}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => {
                    event.preventDefault(); // keep focus in the field until the choice is handled
                    choose(place);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={`flex cursor-pointer items-start gap-2 px-4 py-2 text-sm ${index === active ? "bg-[var(--outly-lavender)]" : ""}`}
                >
                  <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--outly-violet)]" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[var(--outly-ink)]">{place.name}</span>
                    <span className="block truncate text-xs text-[var(--outly-muted)]">
                      {PLACE_CATEGORY_LABELS[place.category]}
                      {place.location ? ` · ${place.location}` : ""}
                    </span>
                  </span>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      {error ? <FormError id={errorId!}>{error}</FormError> : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs font-semibold text-[var(--outly-violet)] transition-colors hover:text-[var(--outly-purple-dark)] disabled:pointer-events-none disabled:opacity-60"
        >
          <Icon name="pin" className="h-3.5 w-3.5" />
          {requesting ? "Getting your location…" : resolving ? "Finding the place name…" : "Use my current location"}
        </button>

        {lookupDone && lookup?.result.ok ? (
          <p role="status" className="text-xs text-[var(--outly-muted)]">
            Location set to {lookup.result.name}. You can edit it.
          </p>
        ) : null}
        {lookupDone && lookup && !lookup.result.ok ? (
          <p role="alert" className="text-xs text-[#B3164C]">
            {lookup.result.reason === "none"
              ? "We found your position but couldn't turn it into a place name. Search or type a location instead."
              : "Couldn't look up the place name right now. Search or type a location instead."}
          </p>
        ) : null}
        {problem ? (
          <p role="alert" className="text-xs text-[#B3164C]">
            {LOCATION_PROBLEMS[problem]}
          </p>
        ) : null}
      </div>
      {!busy && !lookupDone && !problem ? (
        <p className="text-xs text-[var(--outly-muted)]">
          Your position is only used to find a place name and isn&apos;t saved. If none of our places is nearby, the name comes
          from OpenStreetMap.
        </p>
      ) : null}
    </div>
  );
}
