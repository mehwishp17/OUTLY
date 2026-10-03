# Frontend ↔ backend integration

The frontend talks to the Django backend (`backend/`) for every module. This
document is the current source of truth; where `authentication.md`,
`feed-integration.md` or `architecture.md` describe mocks or "future work",
this document wins.

## Running locally

1. Backend: `cd backend`, `docker compose up -d db redis`, create the venv,
   `python manage.py migrate`, `python manage.py seed_explore`, then run the ASGI
   server (`daphne config.asgi:application -p 8000`). Swagger: `http://127.0.0.1:8000/api/docs/`.
2. Frontend `.env.local` (git-ignored, no secrets):
   ```
   OUTLY_API_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_OUTLY_WS_URL=ws://127.0.0.1:8000/ws/chat/
   ```
3. `npm run dev` (or `npm run build && npm run start`).

Use `127.0.0.1`, not `localhost`: on Windows `localhost` can resolve to IPv6 first and add a delay.

## How a request flows

```
browser ──► /api/backend/<resource>/…  (Next route handler, app/api/backend/[...path])
        ──► Django /api/v1/<resource>/…
```

* Tokens live only in httpOnly cookies (`outly_access`, `outly_refresh`); browser
  code never sees them. The proxy attaches the bearer token and refreshes it once
  on a 401 (`lib/api/backend.ts`).
* The proxy only forwards an allow-list of resources (`ALLOWED_RESOURCES` in the route).
* Auth endpoints that must set or clear cookies live under `app/api/auth/*`;
  public ones (forgot/reset password, verify email) under `app/api/auth/public/*`.
* Chat realtime uses a WebSocket opened directly to the backend with a short-lived
  ticket obtained through the proxy (`lib/realtime.ts`).

## Layers

| Layer | Where | Role |
| --- | --- | --- |
| API clients | `lib/api/*.ts` | One file per module: calls `callBackend`/`fetchAll` and maps backend JSON to the existing frontend types. |
| Stores | `context/*-store-context.tsx` | Same interfaces as before, now async and API-backed, with loading/error state; optimistic updates (likes, saves, follows) roll back on failure. |
| Session scope | `components/layout/session-scope.tsx` | Remounts the app tree when the signed-in account changes, so no module state leaks between accounts. |
| Admin gate | `components/admin/admin-access-gate.tsx` | UI gate only — the backend enforces roles on every admin endpoint. |

## Modules connected

Authentication (signup, login, logout, refresh, forgot/reset password, email
verification), profile (edit, avatar, privacy, onboarding), feed (posts with photos,
comments, likes, saves), explore (places and trails, server-side search/filters,
saved places, map), reviews, activities and history, events (capacity, approval),
groups (public/private, join requests, roles, group feed), partner requests,
social graph (follow/unfollow, followers, people search), chat (REST + WebSocket,
unread counts), notifications, achievements/badges/leaderboard, reports and
moderation, admin (users, content, reports, audit log, places, events, analytics).

## UI additions required by the real backend

Existing screens, layout and styling are unchanged. Small additions only where the backend
exposes behaviour the mock lacked: a Reviews section on place/trail/event pages, a
"Requests to join" list in the group Members tab, moderation-decision chips on admin
reports, a "Requested" follow state for private accounts, and an Admin link/gate for staff.

## Not surfaced in the UI (backend supports it)

Blocking users, approving follow requests, organizer applications, uploading place/event/activity
photos. Place images use local `/public` paths.

## Demo data

`python manage.py seed_explore` loads the curated places and trails. `python manage.py seed_demo`
adds a small realistic community (8 people and an admin, posts with photos and comments, 4 groups
with cover photos, events, activities, partner requests, reviews, chats). It goes through the
real API, so counters, notifications and badges are genuine; it is additive, idempotent and
refuses to run unless `DJANGO_DEBUG=true`. It never deletes anything: for a clean demo, point
`DATABASE_URL` at a fresh database (for example `.../outly_demo`), run `migrate`,
`seed_explore`, `seed_demo`, and start the backend with that URL. Demo accounts are
`<first>.<last>@outly.demo` (e.g. `maya.deshpande@outly.demo`, admin `neha.admin@outly.demo`) with the
local-only password printed by the command.

Group covers come from the backend `Group.image` field. Event cards show the photo of the
Explore place or trail the event is linked to. Events and activities have no image field of their own.

## Known limitations

* The Explore map is a schematic overview: pins are positioned from the real coordinates but drawn on
  a plain canvas, not a tile map. Trail route previews come from the seeded `TrailPoint` rows, which
  were derived from the original design's schematic routes, not recorded GPS tracks.

## Test notes

Real-browser checks were run with Playwright against the local backend. Signup/login
endpoints are throttled per IP; when scripting many signups, flush Redis between runs
(`docker compose exec redis redis-cli FLUSHALL`). Verification and reset emails are
printed by the console email backend to the backend log (quoted-printable encoded).
