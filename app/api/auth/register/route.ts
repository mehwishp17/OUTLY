import { postBackend, storeSession } from "@/lib/api/backend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ success: false, message: "Invalid request.", errors: null }, { status: 400 });
  }

  const { status, envelope } = await postBackend("/api/v1/auth/register/", {
    full_name: body.full_name,
    email: body.email,
    password: body.password,
    confirm_password: body.confirm_password,
    terms_accepted: body.terms_accepted,
  });

  // Register returns the new user but no tokens, so sign the user in with the
  // same credentials via the backend's login endpoint to start a session.
  if (envelope?.success) {
    const login = await postBackend("/api/v1/auth/login/", { email: body.email, password: body.password });
    if (login.envelope?.success) await storeSession(login.envelope.data);
  }

  return Response.json(
    { success: envelope?.success ?? false, message: envelope?.message ?? "", errors: envelope?.errors ?? null },
    { status: envelope ? status : 503 },
  );
}
