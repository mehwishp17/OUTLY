# OUTLY — Authentication (Phase 2)

> **Note:** this document describes the original frontend-only prototype. The app is now connected to the Django backend — see [backend-integration.md](./backend-integration.md) for the current behaviour.


## Status: frontend-only, fully mocked

Everything under `/login`, `/signup`, `/forgot-password`, `/verify-email`,
and `/onboarding` is **UI only**. There is no real authentication provider,
database, API route, session, or password storage anywhere in this
project. All "success" and "error" states you see are produced entirely in
the browser by `lib/mock/mock-auth.ts`.

Do not present this build to end users as having working accounts —
nothing submitted through these forms is saved anywhere once the page is
closed or reloaded.

## Route list

| Route | Purpose |
|---|---|
| `/login` | Mocked login form (email + password). |
| `/signup` | Mocked registration form (name, email, password, confirm, terms). |
| `/forgot-password` | Mocked password-reset request (email only). |
| `/verify-email` | Frontend-only "check your inbox" screen with a mocked resend action. |
| `/onboarding` | 4-step onboarding flow (interests → activity level → location → summary), local React state only. |

## Form validation rules

Defined in `lib/validation/auth-schemas.ts`:

- **Email** — required, must match a standard `local@domain.tld` pattern.
- **Full name** (sign-up) — required, 2–80 characters.
- **Login password** — required, minimum 8 characters (this is intentionally
  looser than sign-up, since a real login should validate against a stored
  hash, not re-enforce complexity rules on every sign-in).
- **Sign-up password** — required and must satisfy all 5 rules, shown live
  via `PasswordStrength`:
  1. At least 8 characters
  2. One uppercase letter
  3. One lowercase letter
  4. One number
  5. One special character
- **Confirm password** (sign-up) — required, must match the password field.
- **Terms checkbox** (sign-up) — must be checked.

All validation messages are specific (e.g. "Password must include: one
uppercase letter, one number.") rather than a generic "Invalid input.",
and are wired to their field via `aria-invalid` + `aria-describedby`, with
`role="alert"` on the message itself.

## Mock submission behavior

`lib/mock/mock-auth.ts` exports four functions, each simulating network
latency (700–1100ms) before resolving a typed result:

- `mockLogin(values)` — always succeeds, **except** when the email is the
  sentinel `fail@outly.test`, which simulates a login failure (attached to
  the password field) so the error UI can be previewed.
- `mockSignup(values)` — always succeeds, **except** for the same sentinel
  email, which simulates an "email already in use" failure.
- `mockPasswordReset(values)` — **always succeeds**, regardless of the
  email entered. This is deliberate: a real implementation must not reveal
  whether an email is registered, and this mock reflects that from the
  start. The success copy is exactly: *"If this email is registered with
  OUTLY, reset instructions would be sent here."*
- `mockResendVerification(email)` — always succeeds except for the same
  sentinel email.

To preview an error state during review/testing, submit any of the login,
sign-up, or verify-email forms using the email `fail@outly.test`.

## Security limitations (by design, for this phase)

- No password is ever sent over the network — there is no network call at
  all, only an in-memory `setTimeout`.
- No password is ever logged (no `console.log`/`console.error` of form
  values anywhere in the codebase).
- No password, token, or session identifier is ever written to
  `localStorage`, `sessionStorage`, or a cookie.
- "Remember me" and the mocked login success do not create any real,
  persisted session — reloading the page returns you to a logged-out
  state.
- The onboarding flow's `OnboardingData` (interests, activity level,
  location) lives only in a single component's `useState` and is
  discarded when the page is left.

## What must never be stored in frontend state or logs

- Raw or hashed passwords.
- Real session tokens or refresh tokens (none exist yet — see below).
- Any data implying a verified/real account exists when it does not.

## Planned session and authorization architecture (future work)

This section describes the intended direction once a real Node.js backend
is integrated — none of it is implemented yet:

1. **Backend auth provider** — `mockLogin`/`mockSignup`/`mockPasswordReset`/
   `mockResendVerification` are replaced with `fetch` calls to Node.js API
   routes (e.g. `/api/auth/login`), which perform real credential checks
   against a database with hashed (e.g. bcrypt/argon2) passwords.
2. **Session strategy** — an HTTP-only, `Secure`, `SameSite` session cookie
   (or a short-lived access token + refresh token pair) issued by the
   backend on successful login; the frontend never handles raw credentials
   after this point.
3. **Email verification** — `/verify-email` becomes a real callback route
   that validates a signed token from an actual email link, rather than a
   client-only "resend" button.
4. **Password reset** — `/forgot-password` issues a real, time-limited
   reset token via email; the existing `/reset-password` route (currently a
   frontend-only mock, `mockResetPassword`) validates that real token
   instead.
5. **Authorization** — protected routes (onboarding completion, future
   dashboard) will check the session server-side (middleware or server
   components) instead of assuming a logged-in state.
6. **Component reuse** — the existing form components, validation
   functions, and `AuthShell`/`AuthBrandPanel` layout are expected to stay
   largely unchanged; only the data-fetching layer (`lib/mock/mock-auth.ts`
   → a real `lib/api/auth.ts`) needs to change.
