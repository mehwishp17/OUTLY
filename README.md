# OUTLY

OUTLY is a public marketing/landing page and authentication/onboarding UI
for a modern outdoor exploration and community platform — a place to
discover trails and destinations, connect with like-minded explorers, and
belong to a community built around real adventures.

- **Phase 1** delivered the public landing page.
- **Phase 2** added auth (login, sign-up, forgot/reset password,
  email-verification) and a multi-step onboarding flow.
- **Phase 3+** added the full signed-in product: Social Feed, Explore
  (places/trails/map), Activities, Events, Groups & Communities, Adventure
  Partner requests, Social Graph (search/profiles/follow), Communication
  (chat), Notifications, Gamification (badges/achievements/leaderboard),
  and an Admin panel. See the Routes table below for the full list.

**Authentication in this project is entirely mocked and frontend-only.**
There is no real authentication provider, database, API, session, or
password storage yet — see `docs/authentication.md` for the full
explanation and future integration plan.

## Technologies used

- [Next.js 16](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS v4 (`@import "tailwindcss";`)
- ESLint (`eslint-config-next`)

## Required Node.js version

Node.js **18.18+** (Node **20 LTS or newer** recommended). This project was
verified with Node v24.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app. If port
3000 is already in use, Next.js will automatically pick the next free port
(e.g. 3001) and print the URL in the terminal.

## Lint

```bash
npm run lint
```

## Production build

```bash
npm run build
npm run start
```

## Routes

Everything below is frontend-only (mocked/session-only state) unless noted.

| Area | Routes |
|---|---|
| Public | `/` |
| Auth | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` |
| Onboarding | `/onboarding` |
| Feed | `/feed`, `/feed/new`, `/feed/[postId]`, `/feed/[postId]/edit` |
| Explore | `/explore`, `/explore/map`, `/explore/places/[placeId]`, `/explore/trails/[trailId]` |
| Activities | `/activities`, `/activities/new`, `/activities/[activityId]`, `/activities/[activityId]/edit` |
| Events | `/events`, `/events/new`, `/events/[eventId]`, `/events/[eventId]/edit`, `/events/[eventId]/participants` |
| Groups | `/groups`, `/groups/new`, `/groups/[groupId]`, `/groups/[groupId]/edit` |
| Partner | `/partner`, `/partner/new`, `/partner/[requestId]`, `/partner/[requestId]/edit`, `/partner/[requestId]/requests` |
| Social Graph | `/people`, `/people/[userId]`, `/people/[userId]/followers`, `/people/[userId]/following` |
| Communication | `/chat`, `/chat/[conversationId]` |
| Notifications | `/notifications` |
| Gamification | `/badges`, `/achievements`, `/leaderboard` |
| Account | `/profile`, `/profile/edit`, `/profile/settings` |
| Admin | `/admin`, `/admin/users`, `/admin/content`, `/admin/reports`, `/admin/moderation`, `/admin/places`, `/admin/events`, `/admin/analytics` |

## Project structure

```
app/
  layout.tsx, page.tsx, globals.css   Root layout, global styles, home route
  (auth)/login, signup,
    forgot-password, verify-email     Auth route pages
  onboarding/                         Onboarding route page
components/
  brand/outly-logo.tsx      Wrapper around the official OUTLY logo (next/image)
  layout/                   Site header (responsive nav) and site footer
  landing/                  One file per landing page section, composed in
                            landing-page.tsx
  auth/                     Auth layout shell, brand panel, form card,
                            login/signup/forgot-password forms, password
                            field + strength, message/link helpers
  onboarding/               Onboarding flow, progress indicator, step
                            components, completion summary
  ui/                       Shared primitives: Button, Input, Checkbox,
                            Label, Alert, LoadingSpinner, FormError, Icon,
                            SectionHeading, FeatureCard, ExperienceCard
lib/
  constants.ts               Typed content arrays (nav links, cards, stats,
                            onboarding interests/activity/locations, etc.)
  utils.ts                   Small class-name helper
  validation/auth-schemas.ts Email/password/name validation functions
  mock/mock-auth.ts          Mocked login/signup/reset/resend functions
types/
  auth.ts, onboarding.ts     Shared TypeScript types for the auth/onboarding UI
public/images/              Static assets, including the OUTLY logo
docs/architecture.md        Architecture notes and future milestones
docs/ui-guidelines.md       Brand/design system reference
docs/authentication.md      Frontend-only auth behavior and future plan
```

## Mock authentication (Phase 2)

- `lib/mock/mock-auth.ts` simulates network delay and returns a typed
  `{ success, message }` (or `{ success: false, message, field }`) result —
  nothing is sent to a server.
- No password is ever stored, hashed, sent over the network, or logged.
- To preview the error state, submit login/sign-up with the email
  `fail@outly.test` (any other field values).
- Full details, security limitations, and the planned real-backend
  integration are documented in `docs/authentication.md`.

## Adding or replacing the OUTLY logo

The logo lives at `public/images/outly-logo.png` and is rendered through
`components/brand/outly-logo.tsx` using `next/image`, so its aspect ratio is
always preserved (it is never stretched or cropped).

To replace it:

1. Add your new image file to `public/images/` (PNG or SVG recommended,
   ideally on a transparent or near-square background).
2. Update the `src` in `components/brand/outly-logo.tsx` to point at the new
   file name.
3. If the new logo's natural aspect ratio differs significantly from a
   square, adjust the default `width`/`height` props passed to `<OutlyLogo />`
   in `site-header.tsx` and `site-footer.tsx` so it still scales cleanly at
   the sizes used in the header and footer.

## Local URL

http://localhost:3000

## Copyright & originality

All visual treatments (gradients, terrain silhouettes, icons, layout) in
this milestone are original, produced with CSS and inline SVG — no
third-party stock imagery is used. The OUTLY logo is the official,
project-owned brand asset supplied by the project owner. See
`docs/ui-guidelines.md` for the full originality note.
