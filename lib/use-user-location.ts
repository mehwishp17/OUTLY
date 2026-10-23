"use client";

import { useCallback, useState } from "react";

/**
 * Browser geolocation, requested only when `request()` is called (from an explicit
 * "Near me" click) — never on page load. The position is kept in memory only: it is not
 * stored, and it is rounded to 3 decimals (about 110 m) before it is used, so the exact
 * position never leaves the browser.
 */

export type UserPosition = { lat: number; lng: number };

export type UserLocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied" // the person (or browser policy) refused permission
  | "unavailable" // no geolocation support, or the device could not determine a position
  | "timeout";

export type UserLocationState = { status: UserLocationStatus; position?: UserPosition };

const round = (value: number) => Math.round(value * 1000) / 1000;

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({ status: "idle" });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "unavailable" });
      return;
    }
    setState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (result) =>
        setState({
          status: "granted",
          position: { lat: round(result.coords.latitude), lng: round(result.coords.longitude) },
        }),
      (error) =>
        setState({
          status:
            error.code === error.PERMISSION_DENIED
              ? "denied"
              : error.code === error.TIMEOUT
                ? "timeout"
                : "unavailable",
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, request, reset };
}
