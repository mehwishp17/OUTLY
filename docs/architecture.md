# OUTLY — Architecture

> **Note:** this document describes the original frontend-only prototype. The app is now connected to the Django backend — see [backend-integration.md](./backend-integration.md) for the current behaviour.


## Current architecture (landing page milestone)

- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4.
- **Rendering:** Every component is a React Server Component by default.
  Only `components/layout/site-header.tsx` is a Client Component
  (`"use client"`), because it needs local state to toggle and animate the
  mobile navigation menu. Everything else — including the icon system,
  cards, and all section content — renders on the server with zero
  client-side JavaScript shipped for it.
- **Routing:** A single route, `/` (`app/page.tsx`), renders
  `components/landing/landing-page.tsx`. In-page navigation (header links,
  CTA buttons, "View experience" links) uses native anchor links
  (`#explore`, `#community`, `#experiences`, `#how-it-works`, `#stories`,
  `#final-cta`) scrolling to `id`-tagged `<section>` elements — no
  client-side router state is needed for this milestone.
- **Styling/theme:** Brand colors, radii, shadows, and gradients are defined
  once as CSS variables in `app/globals.css` (`--outly-*` tokens) and
  consumed via Tailwind's `@theme inline` mapping and arbitrary-value
  classes (`bg-[var(--outly-night)]`, etc.). This keeps the palette
  centralized and easy to re-theme without touching individual components.
- **Content:** All repeated section content (nav links, explore cards,
  community stats/members, experiences, steps, stories, footer groups,
  social links) is defined as typed arrays in `lib/constants.ts` and mapped
  over in the corresponding section components — no duplicated markup per
  item.
- **Icon system:** A single `components/ui/icon.tsx` renders every inline
  SVG glyph used across the page (nav menu/close, feature icons, pin,
  arrow, quote mark, social glyphs) from one `IconName` union, so there is
  one place to audit/extend the icon set instead of `<svg>` markup
  duplicated per component.

## Component responsibilities

| Component | Responsibility |
|---|---|
| `components/brand/outly-logo.tsx` | Renders the official logo via `next/image`, preserving aspect ratio; optionally wraps it in a `Link`. |
| `components/layout/site-header.tsx` | Sticky translucent nav bar, desktop nav links with animated underline, login/join actions, and an animated, accessible mobile menu (`aria-expanded`/`aria-controls`, closes on selection). |
| `components/layout/site-footer.tsx` | Dark footer with logo, tagline, footer link groups, and clearly labeled ("Soon") placeholder links/social icons. |
| `components/landing/*-section.tsx` | One React component per landing page section (hero, explore, community, experiences, how-it-works, stories, final CTA), each independently editable. |
| `components/landing/landing-page.tsx` | Composes header + all sections + footer in order. |
| `components/ui/button.tsx` | Shared CTA button (link or button element) with primary/secondary/ghost variants. |
| `components/ui/section-heading.tsx` | Consistent eyebrow + title + description block, light/dark tone aware. |
| `components/ui/feature-card.tsx` | Explore section card: icon badge, category label, title, description. |
| `components/ui/experience-card.tsx` | Featured experience card with layered gradient + inline SVG terrain silhouette instead of a flat placeholder or external image. |
| `components/ui/icon.tsx` | Centralized inline SVG icon set (`IconName` union). |
| `lib/constants.ts` | Single source of truth for typed, repeated section content, including `PLACEHOLDER_HREF` for routes that don't exist yet. |
| `lib/utils.ts` | Small `cn()` class-name joiner (avoids adding a dependency for this milestone). |

## Brand token strategy

- Palette is derived directly from the official OUTLY logo: deep purple →
  violet → pink gradient, plus a dark "night" tone and a light lavender
  tone, defined once as CSS variables in `app/globals.css`:
  `--outly-purple-dark`, `--outly-purple`, `--outly-violet`, `--outly-pink`,
  `--outly-pink-bright`, `--outly-lavender`, `--outly-night`, `--outly-ink`,
  `--outly-muted`, `--outly-border`, `--outly-white`.
- Three gradients are named tokens (`--gradient-brand`, `--gradient-brand-alt`,
  `--gradient-night`) so any component can reuse the exact same brand
  gradient rather than re-declaring `linear-gradient(...)` inline.
- Sections deliberately alternate between light (white/lavender) and dark
  (`--outly-night`) backgrounds so the page has visual depth instead of one
  flat color throughout, with gradient bands reserved for emphasis (hero
  visual, final CTA, icon badges, CTA buttons, one "featured" story card).
- The logo image itself is never recolored/stretched; where it needs to sit
  on a dark background (footer, final CTA) it is placed inside a small
  white/translucent rounded badge rather than being inverted, since the
  source file is not a transparent-background asset.

## Responsive strategy

- Layout is mobile-first: base (375px) styles stack single-column, with
  `sm:`/`lg:` breakpoints progressively introducing multi-column grids
  (explore cards 1→2→4 columns, experience cards 1→2→4, community section
  1→2 columns, stories 1→3 columns).
- Hero visual and CTA rows switch from stacked (`flex-col`) to inline
  (`sm:flex-row`) specifically to avoid cramped text/badges at 375px.
- Container widths are capped (`max-w-7xl`/`max-w-5xl`/`max-w-3xl`) with
  consistent horizontal padding (`px-4 sm:px-6 lg:px-8`) so content never
  touches the viewport edge and never overflows horizontally.
- Verified visually at 375px, 768px, 1024px, and 1440px viewport widths.

## Accessibility strategy

- Semantic landmarks throughout: `<header>`, `<nav>`, `<main>`, `<section>`,
  `<article>`, `<figure>`/`<figcaption>`, `<footer>`.
- Heading order is sequential (`h1` in the hero, `h2` per section heading,
  `h3` for card/component titles) — no skipped levels.
- The mobile menu button uses `aria-expanded` and `aria-controls`; decorative
  icons use `aria-hidden="true"`; group-avatar lists use visually-hidden
  (`sr-only`) real names instead of relying on a `title` attribute alone.
- A layered `:focus-visible` style (`outline` + `box-shadow` ring) is defined
  globally so keyboard focus stays visible on both light and dark/gradient
  backgrounds, not just plain backgrounds.
- `@media (prefers-reduced-motion: reduce)` disables/shortens transitions
  and animations globally, and hover-lift effects are additionally guarded
  with Tailwind's `motion-reduce:` variant.
- Illustrative sample statistics (community counts) are labeled "Illustrative
  figures for preview purposes" rather than presented as verified claims.
- Unfinished routes (About, Careers, Contact, Legal pages, social profiles)
  render a visible "Soon" badge / `aria-disabled` instead of behaving like a
  live, working link.

## Performance strategy

- No client-side data fetching, external image requests, or animation
  libraries — all decorative visuals are CSS gradients/shapes and inline
  SVG, so there is no image payload beyond the one logo file.
- Only one Client Component (`site-header.tsx`) ships interactive JS; the
  rest of the tree is server-rendered and streamed as static HTML.
- `next/image` handles the logo so it is served at the exact size requested
  (no oversized asset downloads).

## Future milestones

The following are explicitly **out of scope** for this landing-page
milestone and are expected to be layered on top of this UI later (backend
is Node.js, integrated separately by the project owner):

- **Authentication** — real login/register flows, replacing the current
  "Log in" / "Join OUTLY" placeholder links.
- **User profiles** — profile pages, avatars, and settings.
- **Explore data** — replacing static explore/experience cards with live,
  queried trail/destination/event data.
- **Communities** — real community pages/data behind the `#community`
  section's preview UI.
- **Events** — event listing/detail pages and RSVP flows behind the
  `#experiences` section.
- **Saved places** — bookmarking trails/destinations.
- **Database** — persistent storage for users, posts, communities, events.
- **API** — a Node.js backend exposing REST/GraphQL endpoints that this
  frontend will call (this project intentionally contains no API routes or
  server actions yet).
- **Notifications** — in-app and email notifications for events, RSVPs, and
  community activity.
- **Admin and moderation** — internal tooling for content moderation,
  community management, and reporting.

---

## Phase 2 — Authentication & onboarding UI

Phase 2 adds the frontend-only auth screens (`/login`, `/signup`,
`/forgot-password`, `/verify-email`) and the `/onboarding` flow on top of
the unchanged Phase 1 landing page. **No real authentication, database,
API, or session exists in this phase** — see `docs/authentication.md` for
the full behavior and security notes.

### Auth route responsibilities

| Route | File | Responsibility |
|---|---|---|
| `/login` | `app/(auth)/login/page.tsx` | Renders `AuthShell` + `LoginForm`. |
| `/signup` | `app/(auth)/signup/page.tsx` | Renders `AuthShell` + `SignupForm`. |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Renders `AuthShell` + `ForgotPasswordForm`. |
| `/verify-email` | `app/(auth)/verify-email/page.tsx` | Server component; reads an optional `?email=` search param and passes it to the client `VerifyEmailPanel`. |
| `/onboarding` | `app/onboarding/page.tsx` | Renders a minimal header (logo only) + `OnboardingFlow`. |

The `(auth)` route group has no dedicated layout — pages render directly
inside the root layout, since `AuthShell` itself provides the auth-specific
chrome (two-column desktop layout, compact mobile header).

### Auth component responsibilities

| Component | Responsibility |
|---|---|
| `components/auth/auth-shell.tsx` | Reusable two-column (desktop) / stacked (mobile) auth layout: renders `AuthBrandPanel` + a centered form card + a "Back to OUTLY" link. |
| `components/auth/auth-brand-panel.tsx` | Desktop-only dark visual side panel: logo badge, brand tagline/message, three short highlight rows, and an original inline-SVG terrain shape. |
| `components/auth/auth-form-card.tsx` | Consistent eyebrow + heading + description block at the top of every auth form. |
| `components/auth/login-form.tsx`, `signup-form.tsx`, `forgot-password-form.tsx` | Client components owning form state, validation, and mock submission for each flow. |
| `components/auth/password-field.tsx` | Password input with an accessible show/hide toggle (`aria-pressed`, action-based `aria-label`). |
| `components/auth/password-strength.tsx` | Live checklist of the 5 sign-up password requirements, updated on every keystroke, with an `aria-live` summary for screen readers. |
| `components/auth/auth-message.tsx` | Auth-specific success/error banner (thin wrapper over `ui/alert.tsx`). |
| `components/auth/auth-links.tsx` | "New to OUTLY? Create an account" style cross-links between auth pages. |
| `components/auth/verify-email-panel.tsx` | Client component for the verify-email screen (resend button, change-email/back-to-login links) — added beyond the initial recommended file list because this page has interactive behavior of its own. |

### Onboarding flow responsibilities

| Component | Responsibility |
|---|---|
| `components/onboarding/onboarding-flow.tsx` | Owns all onboarding state (`OnboardingData`, current step index) in local `useState` only — nothing is persisted. Renders the active step, progress indicator, and Back/Continue controls. |
| `components/onboarding/onboarding-progress.tsx` | "Step X of Y" text + a restrained progress bar. |
| `components/onboarding/interest-selection-step.tsx` | Step 1: multi-select interests grid (requires ≥1 selection). |
| `components/onboarding/activity-level-step.tsx` | Step 2: single-select activity level (requires a selection). |
| `components/onboarding/location-selection-step.tsx` | Step 3: city/region text input + example region chips; "Use my current location" is presentational only and never calls the browser geolocation API. |
| `components/onboarding/onboarding-complete.tsx` | Step 4: read-only summary of selections + "Start exploring" (returns to `/`) + "Edit preferences" (jumps back to step 1 without losing data). |
| `components/onboarding/selection-card.tsx` | Shared selectable card (toggle button, `aria-pressed`) used by both the interests grid and the activity-level list. |

Navigating Back never clears `data` — the `OnboardingFlow` component only
ever updates fields, it never resets state when changing `stepIndex`.

### Validation approach

No schema library (e.g. Zod) is installed. `lib/validation/auth-schemas.ts`
exports small, typed, pure functions (`validateEmail`, `validateFullName`,
`validateLoginPassword`, `validateSignupPassword`, `validateConfirmPassword`,
plus a `validate*Form` per form) and a shared `PASSWORD_REQUIREMENTS` array
reused by both validation and the live `PasswordStrength` checklist. This
keeps the dependency footprint unchanged while still centralizing the
rules in one place.

### Mock service responsibilities

`lib/mock/mock-auth.ts` exports `mockLogin`, `mockSignup`,
`mockPasswordReset`, and `mockResendVerification`. Each simulates latency
with a `setTimeout`-based `delay()` helper and returns a typed
`MockAuthResult`. A single sentinel email (`fail@outly.test`) deliberately
triggers the failure branch in `mockLogin`/`mockSignup`/
`mockResendVerification` so the error UI can be exercised without a real
backend; `mockPasswordReset` always succeeds by design (see
`docs/authentication.md`).

### Accessibility approach (Phase 2 additions)

- Every form field is built on the shared `Input`/`Checkbox`/`PasswordField`
  primitives, which wire up `aria-invalid` and `aria-describedby` to the
  matching `FormError` (`role="alert"`) automatically.
- Icon-only buttons (password show/hide, mobile menu) always carry an
  `aria-label` describing the action, plus `aria-pressed`/`aria-expanded`
  where relevant.
- `Alert`/`AuthMessage` use `role="alert"` for errors and `role="status"`
  for success/info so assistive tech announces the right urgency.
- The onboarding "Continue" button is a real `disabled` control (not just
  visually dimmed) when a step's requirement isn't met, and the
  requirement is also spelled out as visible text next to the relevant
  field — never communicated by color alone.
- `PasswordStrength` exposes an `aria-live="polite"` summary sentence in
  addition to the visual checklist, so screen reader users get progress
  without every keystroke being read aloud.

### Future authentication integration plan

See `docs/authentication.md` for the detailed plan. In summary: replace
`lib/mock/mock-auth.ts` call sites with real requests to the Node.js
backend, introduce a proper session/token strategy, and keep the existing
form components, validation, and layout largely unchanged — only the data
layer changes.
