import { postBackend } from "@/lib/api/backend";

/**
 * Public (no session) auth actions that need no cookie handling: password
 * reset, reset confirmation, email verification and its resend. The backend
 * answers every one of them without revealing whether an account exists.
 * (Login, register and logout have their own handlers because they manage
 * the session cookies.)
 */
const ALLOWED = new Set(["password-reset", "password-reset/confirm", "verify-email", "resend-verification"]);

export async function POST(request: Request, ctx: { params: Promise<{ action: string[] }> }) {
  const { action } = await ctx.params;
  const path = action.join("/");
  if (!ALLOWED.has(path)) {
    return Response.json({ success: false, message: "Not found.", errors: null }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ success: false, message: "Invalid request.", errors: null }, { status: 400 });
  }

  const { status, envelope } = await postBackend(`/api/v1/auth/${path}/`, body);
  return Response.json(
    { success: envelope?.success ?? false, message: envelope?.message ?? "", errors: envelope?.errors ?? null },
    { status: envelope ? status : 503 },
  );
}
