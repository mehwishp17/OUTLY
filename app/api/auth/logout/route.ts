import { clearSession, postBackend, readRefreshToken } from "@/lib/api/backend";

/** Revokes the refresh token on the backend, then always clears the local
 * session cookies — a user who clicks "Log out" is logged out here even if
 * the backend is unreachable. */
export async function POST() {
  const refresh = await readRefreshToken();
  if (refresh) await postBackend("/api/v1/auth/logout/", { refresh });
  await clearSession();
  return Response.json({ success: true, message: "Logged out." });
}
