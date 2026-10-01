/**
 * Browser-side helper for authenticated backend calls. Requests go to the
 * `/api/backend/*` pass-through (`app/api/backend/[...path]/route.ts`), which
 * adds the session's bearer token; the backend envelope is
 * `{ success, message, data, errors, meta }`.
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

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string> | null;
};

export const UNREACHABLE = "We couldn't reach OUTLY right now. Please try again in a moment.";

export async function callBackend<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`/api/backend/${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, message: UNREACHABLE };
  }

  if (response.status === 204) return { ok: true, data: undefined as T };

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (response.ok && envelope?.success !== false && envelope?.data !== undefined) {
    return { ok: true, data: envelope.data };
  }
  if (response.status === 401) return { ok: false, status: 401, message: "Your session has expired." };
  if (response.status >= 500 || !envelope) return { ok: false, status: response.status, message: UNREACHABLE };
  return {
    ok: false,
    status: response.status,
    message: envelope.message || "Something went wrong.",
    errors: envelope.errors ?? undefined,
  };
}
