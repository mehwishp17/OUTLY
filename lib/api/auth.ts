import type { LoginFormValues, SignupFormValues } from "@/types/auth";

/** Result of a real auth request. `fieldErrors` maps backend validation
 * errors onto the form's own field names. */
export type AuthApiResult =
  | { success: true; message: string }
  | { success: false; message: string; fieldErrors: Record<string, string> };

const UNREACHABLE =
  "We couldn't reach OUTLY right now. Please check your connection and try again in a moment.";

/** Backend field name → form field name. */
const FIELD_MAP: Record<string, string> = {
  email: "email",
  password: "password",
  full_name: "fullName",
  confirm_password: "confirmPassword",
  terms_accepted: "acceptTerms",
};

type ApiBody = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[] | string> | null;
};

async function postAuth(path: string, payload: unknown, fallback: string): Promise<AuthApiResult> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { success: false, message: UNREACHABLE, fieldErrors: {} };
  }

  const body = (await response.json().catch(() => null)) as ApiBody | null;
  if (response.ok && body?.success) {
    return { success: true, message: body.message ?? "" };
  }
  if (!body || response.status >= 500) {
    return { success: false, message: UNREACHABLE, fieldErrors: {} };
  }

  const fieldErrors: Record<string, string> = {};
  for (const [key, raw] of Object.entries(body.errors ?? {})) {
    const field = FIELD_MAP[key];
    const text = Array.isArray(raw) ? raw[0] : raw;
    if (field && text) fieldErrors[field] = text;
  }
  return { success: false, message: body.message || fallback, fieldErrors };
}

/** Returns whether the server cleared the session cookies. */
export async function logoutRequest(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}

export function loginRequest(values: LoginFormValues): Promise<AuthApiResult> {
  return postAuth(
    "/api/auth/login",
    { email: values.email.trim(), password: values.password },
    "Invalid email or password.",
  );
}

export function registerRequest(values: SignupFormValues): Promise<AuthApiResult> {
  return postAuth(
    "/api/auth/register",
    {
      full_name: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
      confirm_password: values.confirmPassword,
      terms_accepted: values.acceptTerms,
    },
    "We couldn't create your account.",
  );
}
