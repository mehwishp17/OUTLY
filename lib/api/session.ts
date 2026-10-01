/**
 * Session constants shared by the auth route handlers and `proxy.ts`.
 * Keep this file free of `next/headers` so the proxy can import it.
 *
 * Backend (Swagger: https://outly-backend-1ipg.onrender.com/api/docs/)
 * issues a 15-minute `access` JWT and a 7-day `refresh` JWT. They are kept
 * in httpOnly cookies and never exposed to client JavaScript.
 */
export const BACKEND_URL = process.env.OUTLY_API_URL ?? "https://outly-backend-1ipg.onrender.com";

export const ACCESS_COOKIE = "outly_access";
export const REFRESH_COOKIE = "outly_refresh";

/** Seconds until the JWT's own `exp` claim, so the cookie expires with it. */
export function secondsUntilExpiry(token: string, fallback: number): number {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    if (typeof exp === "number") return Math.max(exp - Math.floor(Date.now() / 1000), 0);
  } catch {
    // Not a decodable JWT — use the fallback.
  }
  return fallback;
}

export function sessionCookieOptions(token: string, fallbackSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: secondsUntilExpiry(token, fallbackSeconds),
  };
}

export const ACCESS_FALLBACK_SECONDS = 60 * 15;
export const REFRESH_FALLBACK_SECONDS = 60 * 60 * 24 * 7;
