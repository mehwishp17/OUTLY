import { postBackend, storeSession } from "@/lib/api/backend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ success: false, message: "Invalid request.", errors: null }, { status: 400 });
  }

  const { status, envelope } = await postBackend("/api/v1/auth/login/", {
    email: body.email,
    password: body.password,
  });
  if (envelope?.success) await storeSession(envelope.data);

  // Tokens stay in the httpOnly cookies; the client only gets the outcome.
  return Response.json(
    { success: envelope?.success ?? false, message: envelope?.message ?? "", errors: envelope?.errors ?? null },
    { status: envelope ? status : 503 },
  );
}
