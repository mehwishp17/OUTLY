"use client";

import { useEffect, useState } from "react";
import { fetchExplore } from "@/lib/api/places";
import { exploreKey } from "@/types/place";

let photos: Promise<Map<string, string>> | undefined;

/** Cover photo of every Explore place/trail that has one, keyed by `exploreKey`. Loaded once per page load. */
function loadPhotos(): Promise<Map<string, string>> {
  photos ??= fetchExplore().then((result) => {
    const map = new Map<string, string>();
    if (result.ok) {
      for (const place of result.data) if (place.photo) map.set(exploreKey(place), place.photo);
    } else {
      photos = undefined; // retry on the next card
    }
    return map;
  });
  return photos;
}

/**
 * The photo of the Explore place/trail an event or activity is linked to
 * (`placeId` is an `exploreKey`), or undefined when it has none.
 */
export function useExplorePhoto(placeId: string | undefined): string | undefined {
  const [photo, setPhoto] = useState<string>();
  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    void loadPhotos().then((map) => {
      if (!cancelled) setPhoto(map.get(placeId));
    });
    return () => {
      cancelled = true;
    };
  }, [placeId]);
  return placeId ? photo : undefined;
}
