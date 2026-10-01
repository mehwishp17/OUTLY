import type { NextRequest } from "next/server";
import { authedBackendFetch } from "@/lib/api/backend";

/**
 * Authenticated pass-through to `${BACKEND}/api/v1/<path>/` using the
 * session cookie as the bearer token. Only the resources the frontend has
 * been wired to are reachable; add a segment here when integrating the next
 * module (events, activities, ...).
 */
const ALLOWED_RESOURCES = new Set(["posts", "users"]);

async function handle(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!ALLOWED_RESOURCES.has(path[0]) || path.some((segment) => !/^[\w-]+$/.test(segment))) {
    return Response.json({ success: false, message: "Not found." }, { status: 404 });
  }

  const hasBody = request.method === "POST" || request.method === "PATCH";
  const { status, body } = await authedBackendFetch(
    request.method,
    `/api/v1/${path.join("/")}/`,
    hasBody ? await request.text() : undefined,
  );

  if (body === null) return new Response(null, { status });
  return new Response(body, { status, headers: { "Content-Type": "application/json" } });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
