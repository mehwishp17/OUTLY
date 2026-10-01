import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_FALLBACK_SECONDS,
  BACKEND_URL,
  REFRESH_COOKIE,
  sessionCookieOptions,
} from "@/lib/api/session";

/**
 * Route protection. Every signed-in area requires a session. Public routes
 * (`/`, `/login`, `/signup`, forgot/reset password, verify email) are not
 * matched, so "Log in" and "Create Account" always open their own pages — even
 * if a session cookie exists; logging in again simply replaces the session.
 *
 * The access token lasts 15 minutes. When it has expired but the 7-day
 * refresh token is still present, the session is renewed through the
 * backend's `POST /api/v1/auth/refresh/` (response: `data.access`) before
 * the request continues. If that fails the cookies are cleared and the user
 * is sent to `/login?next=<original path>`.
 */
export const config = {
  matcher: [
    "/onboarding/:path*",
    "/feed/:path*",
    "/explore/:path*",
    "/activities/:path*",
    "/events/:path*",
    "/groups/:path*",
    "/partner/:path*",
    "/people/:path*",
    "/chat/:path*",
    "/notifications/:path*",
    "/badges/:path*",
    "/achievements/:path*",
    "/leaderboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};

async function refreshAccessToken(refresh: string): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { success?: boolean; data?: { access?: string } };
    return body.success && body.data?.access ? body.data.access : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (access) return NextResponse.next();

  if (refresh) {
    const renewed = await refreshAccessToken(refresh);
    if (renewed) {
      request.cookies.set(ACCESS_COOKIE, renewed);
      const response = NextResponse.next({ request: { headers: request.headers } });
      response.cookies.set(ACCESS_COOKIE, renewed, sessionCookieOptions(renewed, ACCESS_FALLBACK_SECONDS));
      return response;
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
