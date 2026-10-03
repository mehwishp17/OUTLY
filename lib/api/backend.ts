import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  ACCESS_FALLBACK_SECONDS,
  BACKEND_URL,
  REFRESH_COOKIE,
  REFRESH_FALLBACK_SECONDS,
  sessionCookieOptions,
} from "@/lib/api/session";

/**
 * Server-side helpers for talking to the OUTLY backend. Used only by the
 * `/api/auth/*` route handlers, so the browser never calls the backend
 * directly (it sends no CORS headers) and JWTs stay in httpOnly cookies.
 */

/** Envelope every backend endpoint returns. */
export type BackendEnvelope = {
  success: boolean;
  message: string;
  data: unknown;
  errors: Record<string, string[] | string> | null;
};

export type BackendResult = { status: number; envelope: BackendEnvelope | null };

/** POSTs JSON to the backend. The free-tier host cold-starts, so the
 * timeout is generous. Returns `envelope: null` if it can't be reached. */
export async function postBackend(path: string, body: unknown): Promise<BackendResult> {
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    const envelope = (await response.json().catch(() => null)) as BackendEnvelope | null;
    return { status: response.status, envelope };
  } catch {
    return { status: 503, envelope: null };
  }
}

/** Finds the first string stored under any of `names`, at any depth of the
 * (untyped) `data` payload. */
function findString(value: unknown, names: string[]): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  for (const [key, child] of Object.entries(value)) {
    if (names.includes(key) && typeof child === "string") return child;
  }
  for (const child of Object.values(value)) {
    const found = findString(child, names);
    if (found) return found;
  }
  return undefined;
}

/** Stores the JWT pair from a login response as httpOnly cookies. Returns
 * whether an access token was present. */
export async function storeSession(data: unknown): Promise<boolean> {
  const access = findString(data, ["access"]);
  const refresh = findString(data, ["refresh"]);
  if (!access) return false;

  const store = await cookies();
  store.set(ACCESS_COOKIE, access, sessionCookieOptions(access, ACCESS_FALLBACK_SECONDS));
  if (refresh) store.set(REFRESH_COOKIE, refresh, sessionCookieOptions(refresh, REFRESH_FALLBACK_SECONDS));
  return true;
}

export async function readRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Renews the access cookie from the refresh cookie via
 * `POST /api/v1/auth/refresh/`. Clears the session if that fails. */
async function refreshSession(): Promise<string | undefined> {
  const refresh = await readRefreshToken();
  if (!refresh) return undefined;

  const { envelope } = await postBackend("/api/v1/auth/refresh/", { refresh });
  const access = envelope?.success ? findString(envelope.data, ["access"]) : undefined;
  if (!access) {
    await clearSession();
    return undefined;
  }
  (await cookies()).set(ACCESS_COOKIE, access, sessionCookieOptions(access, ACCESS_FALLBACK_SECONDS));
  return access;
}

export type ProxiedResponse = { status: number; body: string | null; contentType?: string };

/** Calls an authenticated backend endpoint with the session's access token,
 * renewing it once (before the call if the cookie has expired, or after a
 * 401) using the refresh token. `body` is JSON text by default; pass raw
 * bytes plus their `contentType` (e.g. multipart image uploads). */
export async function authedBackendFetch(
  method: string,
  path: string,
  body?: string | ArrayBuffer,
  contentType?: string,
): Promise<ProxiedResponse> {
  let access = (await cookies()).get(ACCESS_COOKIE)?.value ?? (await refreshSession());

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!access) return { status: 401, body: null };
    try {
      const hasBody = body !== undefined && (typeof body !== "string" || body.length > 0);
      const response = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${access}`,
          Accept: "application/json",
          ...(hasBody ? { "Content-Type": contentType ?? "application/json" } : {}),
        },
        body: hasBody ? body : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(60_000),
      });
      if (response.status === 401 && attempt === 0) {
        access = await refreshSession();
        continue;
      }
      return {
        status: response.status,
        body: response.status === 204 ? null : await response.text(),
        contentType: response.headers.get("content-type") ?? undefined,
      };
    } catch {
      return { status: 503, body: null };
    }
  }
  return { status: 401, body: null };
}
