import type { NextRequest } from "next/server";
import { authedBackendFetch } from "@/lib/api/backend";

/**
 * Authenticated pass-through to `${BACKEND}/api/v1/<path>/` using the session
 * cookie as the bearer token (the browser never sees the JWT). Query strings
 * and multipart uploads are forwarded as-is. Only the resources the frontend
 * is wired to are reachable.
 */
const ALLOWED_RESOURCES = new Set([
  "posts",
  "comments",
  "users",
  "feed",
  "media",
  "places",
  "trails",
  "map",
  "search",
  "activities",
  "events",
  "groups",
  "partner-requests",
  "chats",
  "notifications",
  "reviews",
  "badges",
  "achievements",
  "leaderboard",
  "reports",
  "organizers",
  "admin",
  "auth",
]);

/** `auth/*` is limited to the signed-in-only actions; login, register, refresh
 * and logout have dedicated handlers that manage the session cookies. */
const ALLOWED_AUTH_PATHS = new Set(["auth/change-password", "auth/sessions"]);

async function handle(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const badSegment = path.some((segment) => !/^[\w-]+$/.test(segment));
  const authOk = path[0] !== "auth" || ALLOWED_AUTH_PATHS.has(path.slice(0, 2).join("/"));
  if (!ALLOWED_RESOURCES.has(path[0]) || badSegment || !authOk) {
    return Response.json({ success: false, message: "Not found." }, { status: 404 });
  }

  const hasBody = ["POST", "PATCH", "PUT"].includes(request.method);
  const contentType = request.headers.get("content-type") ?? undefined;
  const isJson = !contentType || contentType.includes("application/json");
  const payload = hasBody ? (isJson ? await request.text() : await request.arrayBuffer()) : undefined;

  const { status, body, contentType: upstreamType } = await authedBackendFetch(
    request.method,
    `/api/v1/${path.join("/")}/${request.nextUrl.search}`,
    payload,
    isJson ? undefined : contentType,
  );

  if (body === null) return new Response(null, { status });
  return new Response(body, { status, headers: { "Content-Type": upstreamType ?? "application/json" } });
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
