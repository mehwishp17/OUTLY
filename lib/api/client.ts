/**
 * Browser-side helper for authenticated backend calls. Requests go to the
 * `/api/backend/*` pass-through (`app/api/backend/[...path]/route.ts`), which
 * adds the session's bearer token; the backend envelope is
 * `{ success, message, data, errors, meta }`.
 *
 * Every module's API file (`feed.ts`, `groups.ts`, ...) builds on `callBackend`
 * (single resource), `callBackendPage` (list + pagination meta) or `fetchAll`
 * (every page of a list), so error handling lives in exactly one place.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message: string;
      /** Backend field errors (`errors`), when it returned any. */
      errors?: Record<string, string[] | string>;
    };

export type PageMeta = {
  next_cursor?: string | null;
  count?: number;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string> | null;
  meta?: PageMeta;
};

export const UNREACHABLE = "We couldn't reach OUTLY right now. Please try again in a moment.";

/** Request body: JSON-serialisable value, or `FormData` for file uploads. */
type Body = unknown;

async function send<T>(
  method: string,
  path: string,
  body?: Body,
): Promise<{ result: ApiResult<T>; meta?: PageMeta }> {
  let response: Response;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    response = await fetch(`/api/backend/${path}`, {
      method,
      headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    return { result: { ok: false, status: 0, message: UNREACHABLE } };
  }

  if (response.status === 204) return { result: { ok: true, data: undefined as T } };

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (response.ok && envelope?.success !== false && envelope?.data !== undefined) {
    return { result: { ok: true, data: envelope.data }, meta: envelope.meta };
  }
  if (response.status === 401) {
    return { result: { ok: false, status: 401, message: "Your session has expired." } };
  }
  if (response.status >= 500 || !envelope) {
    return { result: { ok: false, status: response.status, message: UNREACHABLE } };
  }
  return {
    result: {
      ok: false,
      status: response.status,
      message: envelope.message || "Something went wrong.",
      errors: envelope.errors ?? undefined,
    },
  };
}

export async function callBackend<T>(method: string, path: string, body?: Body): Promise<ApiResult<T>> {
  return (await send<T>(method, path, body)).result;
}

/** One page of a list: items in `data`, cursor/offset info in `meta`. */
export async function callBackendPage<T>(
  path: string,
): Promise<ApiResult<{ items: T[]; meta: PageMeta }>> {
  const { result, meta } = await send<T[]>("GET", path);
  return result.ok ? { ok: true, data: { items: result.data, meta: meta ?? {} } } : result;
}

/** Loads every page of a cursor- or offset-paginated list (100 per request).
 * Capped so a runaway list can't freeze the UI. */
export async function fetchAll<T>(path: string, maxItems = 500): Promise<ApiResult<T[]>> {
  const separator = path.includes("?") ? "&" : "?";
  const items: T[] = [];
  let cursor: string | null | undefined;
  let offset = 0;
  for (let page = 0; page < 20; page += 1) {
    const query = cursor ? `limit=100&cursor=${encodeURIComponent(cursor)}` : `limit=100&offset=${offset}`;
    const result = await callBackendPage<T>(`${path}${separator}${query}`);
    if (!result.ok) return result;
    items.push(...result.data.items);
    const { meta } = result.data;
    if (items.length >= maxItems) break;
    if (meta.next_cursor) {
      cursor = meta.next_cursor;
    } else if (typeof meta.count === "number" && offset + result.data.items.length < meta.count) {
      offset += result.data.items.length;
      cursor = undefined;
    } else {
      break;
    }
  }
  return { ok: true, data: items };
}

/** First backend field error (or the generic message) as plain text. */
export function firstError(result: Extract<ApiResult<unknown>, { ok: false }>): string {
  const first = result.errors ? Object.values(result.errors)[0] : undefined;
  const text = Array.isArray(first) ? first[0] : first;
  return text || result.message;
}
