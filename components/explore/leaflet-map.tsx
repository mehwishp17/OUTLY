"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMapInstance, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Real, interactive map (Leaflet) with markers at actual coordinates. Zoom and pan work with
 * the mouse, touch and keyboard (+/- and arrow keys). A marker's popup links to the place or trail
 * when it has an `href`.
 *
 * Tiles default to OpenStreetMap's public tile server, which is intended for light/development use:
 * check https://operations.osmfoundation.org/policies/tiles/ before production and switch to a
 * hosted provider (or your own tile server) with `NEXT_PUBLIC_MAP_TILE_URL` /
 * `NEXT_PUBLIC_MAP_ATTRIBUTION`. Attribution is always shown.
 *
 * Leaflet is imported inside an effect, so nothing here touches `window` during server rendering.
 */

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Report tiles as failed after this many load errors when none has loaded. */
const TILE_FAILURE_THRESHOLD = 3;

export type MapMarker = {
  key: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  /** When set, the popup shows a "View details" link to it. */
  href?: string;
};

export type RoutePoint = { lat: number; lng: number };

type LeafletMapProps = {
  markers: MapMarker[];
  /**
   * A validated, recorded track to draw (start and end markers, map fitted to it). Pass nothing
   * unless the geometry really is a recorded track: never schematic or generated points.
   */
  route?: RoutePoint[];
  /** Opens this marker's popup and moves the map to it (`n` changes on every request, so repeats work). */
  focus?: { key: string; n: number };
  /** Called with a marker's `href` when its popup link is used (client-side navigation). */
  onNavigate?: (href: string) => void;
  /** Zoom used when there is exactly one marker and no route. */
  singleMarkerZoom?: number;
  /** The map and its markers are on screen. */
  onReady?: () => void;
  /** The map could not start (for example Leaflet failed to load). */
  onError?: () => void;
  /** No map tile could be loaded (offline, blocked, or the tile server is down). */
  onTilesFailed?: () => void;
  className?: string;
  label: string;
};

const MARKER_STYLE =
  "display:block;width:26px;height:26px;border-radius:9999px;border:3px solid #fff;" +
  "background:var(--gradient-brand);box-shadow:0 4px 12px rgba(53,16,128,.35)";

const endpointStyle = (color: string) =>
  `display:block;width:18px;height:18px;border-radius:9999px;border:3px solid #fff;background:${color};` +
  "box-shadow:0 2px 8px rgba(53,16,128,.35)";

/** Popup content is built with DOM nodes and `textContent`, so place names can never inject HTML. */
function popupContent(marker: MapMarker, onNavigate: (href: string) => void): HTMLElement {
  const root = document.createElement("div");
  root.style.minWidth = "9rem";
  const title = document.createElement("strong");
  title.textContent = marker.title;
  title.style.display = "block";
  const subtitle = document.createElement("span");
  subtitle.textContent = marker.subtitle;
  subtitle.style.cssText = "display:block;font-size:12px;opacity:.75;margin-top:2px";
  root.append(title, subtitle);
  const href = marker.href;
  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = "View details →";
    link.style.cssText = "display:inline-block;margin-top:6px;font-weight:600;color:#7c3aed";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      onNavigate(href);
    });
    root.append(link);
  }
  return root;
}

export function LeafletMap({
  markers,
  route,
  focus,
  onNavigate,
  singleMarkerZoom = 11,
  onReady,
  onError,
  onTilesFailed,
  className,
  label,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRefs = useRef<Map<string, Marker>>(new Map());
  // Latest callbacks, so the map is not rebuilt when a parent passes a new function.
  const callbacks = useRef({ onNavigate, onReady, onError, onTilesFailed });
  useEffect(() => {
    callbacks.current = { onNavigate, onReady, onError, onTilesFailed };
  }, [onNavigate, onReady, onError, onTilesFailed]);

  // Build (and tear down) the map and its markers whenever the marker set or route changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: LeafletMapInstance | undefined;

    void import("leaflet")
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        map = L.map(container, { scrollWheelZoom: true, zoomControl: true });
        mapRef.current = map;

        let tilesLoaded = 0;
        let tileErrors = 0;
        let failureReported = false;
        const tiles = L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || DEFAULT_TILE_URL, {
          attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || DEFAULT_ATTRIBUTION,
          maxZoom: 19,
        });
        tiles.on("tileload", () => {
          tilesLoaded += 1;
        });
        tiles.on("tileerror", () => {
          tileErrors += 1;
          if (tilesLoaded === 0 && tileErrors >= TILE_FAILURE_THRESHOLD && !failureReported) {
            failureReported = true;
            callbacks.current.onTilesFailed?.();
          }
        });
        tiles.addTo(map);

        const icon = L.divIcon({
          className: "",
          html: `<span style="${MARKER_STYLE}"></span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          popupAnchor: [0, -14],
        });
        markerRefs.current = new Map();
        for (const item of markers) {
          const marker = L.marker([item.lat, item.lng], { icon, title: item.title, alt: item.title, keyboard: true })
            .bindPopup(popupContent(item, (href) => callbacks.current.onNavigate?.(href)))
            .addTo(map);
          markerRefs.current.set(item.key, marker);
        }

        if (route && route.length >= 2) {
          const path = route.map((p) => [p.lat, p.lng] as [number, number]);
          const line = L.polyline(path, { color: "#7c3aed", weight: 4, opacity: 0.9 }).addTo(map);
          const endpoint = (color: string) =>
            L.divIcon({
              className: "",
              html: `<span style="${endpointStyle(color)}"></span>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            });
          L.marker(path[0], { icon: endpoint("#16a34a"), title: "Start of the route", alt: "Start of the route", keyboard: true }).addTo(map);
          L.marker(path[path.length - 1], { icon: endpoint("#ec4899"), title: "End of the route", alt: "End of the route", keyboard: true }).addTo(map);
          map.fitBounds(line.getBounds(), { padding: [32, 32] });
        } else if (markers.length === 0) {
          map.setView([20.5937, 78.9629], 4); // no markers: a neutral overview, not a fake location
        } else if (markers.length === 1) {
          map.setView([markers[0].lat, markers[0].lng], singleMarkerZoom);
        } else {
          map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number])), { padding: [40, 40], maxZoom: 12 });
        }
        callbacks.current.onReady?.();
      })
      .catch(() => {
        if (!cancelled) callbacks.current.onError?.();
      });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRefs.current = new Map();
    };
  }, [markers, route, singleMarkerZoom]);

  // Move to and open a marker when the list asks for it.
  useEffect(() => {
    if (!focus) return;
    const marker = markerRefs.current.get(focus.key);
    const map = mapRef.current;
    if (!marker || !map) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 11), { duration: 0.6 });
    marker.openPopup();
  }, [focus]);

  return <div ref={containerRef} role="region" aria-label={label} className={className} />;
}
