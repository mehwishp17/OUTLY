# OUTLY — Feed backend integration

> **Note:** this document describes the original frontend-only prototype. The app is now connected to the Django backend — see [backend-integration.md](./backend-integration.md) for the current behaviour.


Home Feed (`/feed`, `/feed/new`, `/feed/[postId]`, `/feed/[postId]/edit`) is
wired to the OUTLY backend. Backend posts carry `Post.persisted = true`;
comments loaded from the API carry `Comment.persisted = true`.

## How it is wired

- Browser → `/api/backend/<resource>/…` (`app/api/backend/[...path]/route.ts`)
  → `https://outly-backend-1ipg.onrender.com/api/v1/<resource>/…`.
  The route adds the `outly_access` cookie as the bearer token and renews it
  from `outly_refresh` when it has expired. Only `posts` and `users` are
  allowed; add a resource to `ALLOWED_RESOURCES` when integrating the next
  module.
- `lib/api/feed.ts` maps the backend shapes to the existing `Post`/`Comment`
  types. `context/social-store-context.tsx` owns the state
  (`refreshFeed`, `createBackendPost`, `editBackendPost`,
  `deleteBackendPost`, `addBackendComment`).

## Backend-supported (persisted)

| Feature | Endpoint |
|---|---|
| List posts | `GET /api/v1/posts/` |
| Create post (caption) | `POST /api/v1/posts/` |
| Edit post (caption) | `PATCH /api/v1/posts/{id}/` |
| Delete post | `DELETE /api/v1/posts/{id}/` |
| List / add comments | `GET` / `POST /api/v1/posts/{id}/comments/` |
| Author name + photo | `GET /api/v1/users/{id}/`, `GET /api/v1/users/me/` |

Posts from the list with `status: "DELETED"` are not shown.

## Temporary local-only behavior (NOT saved to the backend)

- **Likes and saves.** The buttons work for the current browser session only.
  They are kept when the feed is re-fetched, but are lost on reload. No
  endpoint exists. Replace `toggleLike` / `toggleSave` in the social store
  when the backend adds them.
- **Group posts** (`Post.groupId`) and all mock non-feed posts: session-only
  mock data, since the backend has no group concept.

## Not available (no backend support) and therefore not shown

- **Location and photos** on Home Feed posts: the composer hides those fields
  for backend posts, and nothing is displayed unless the backend later
  provides it. (`place_id` exists on the backend but is a place reference,
  not free text.)
- **Comment edit / delete**: no endpoints, so backend comments are read-only
  (no actions menu).

## Known limits

- The feed makes one request per post for comments plus one per distinct
  author (run in parallel); the backend has no batch endpoint or pagination.
- The backend host cold-starts, so the first load can take up to a minute.
- Author links go to `/people/<backend id>`, which the mock people directory
  does not know yet.
