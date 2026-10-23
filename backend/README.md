# OUTLY backend

Django 6 + Django REST Framework + PostgreSQL + Redis + Channels (WebSockets). Lives next to the
Next.js frontend in `outly/backend`. Every response uses one envelope:

```json
{ "success": true, "message": "", "data": <payload>, "errors": null, "meta": {} }
```

Lists put the items in `data` and pagination in `meta` (`next_cursor`, or `count/limit/offset`
for ranked searches), so the frontend's existing `callBackend()` keeps working unchanged.

## Run locally

```bash
cd backend
docker compose up -d                 # PostGIS 16 on 127.0.0.1:5433, Redis on 6379
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt     # Linux/macOS: .venv/bin/python
cp .env.example .env                 # then edit secrets
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py createsuperuser   # then set role=ADMINISTRATOR via /api/v1/admin/users/
.venv/Scripts/python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application   # HTTP + WebSockets
```

Swagger: <http://127.0.0.1:8000/api/docs/> - schema: `/api/schema/` - health: `/api/v1/health/`.
Use `127.0.0.1`, not `localhost`, on Windows (IPv6 fallback adds ~2 s per connection).
Point the frontend at it with `OUTLY_API_URL=http://127.0.0.1:8000`.

Checks: `python manage.py check`, `python manage.py makemigrations --check`, `pytest`.
Production: gunicorn/daphne behind HTTPS, `DJANGO_DEBUG=false`, real `DJANGO_SECRET_KEY`,
`DATABASE_URL`, `REDIS_URL`, `CORS_ALLOWED_ORIGINS`, `NUM_PROXIES=1` behind Render.

## Layout

`apps/` one app per domain: accounts, profiles, follows (follows+blocks), posts (posts, media,
likes, saves, comments, feed), places (places, trails, search, map), activities, events, groups,
partner, messaging (REST + WebSocket), notifications, reviews, achievements (badges,
leaderboard), organizers, moderation (reports, actions, audit log, admin tools), analytics,
common (envelope, errors, pagination, permissions, uploads, throttling).
Business rules live in `services.py`; read-side visibility rules in `selectors.py`.

## Authentication

JWT (15 min access / 7 day refresh, blacklist on logout, reset and suspension). Registration,
login, refresh, logout, password reset (+confirm), email verification (+resend), change password,
session list/revoke. Suspended users are locked out on the next request; restricted users are
read-only. The frontend's httpOnly-cookie flow works unchanged (`data.access`, `data.refresh`).

WebSockets: `POST /api/v1/chats/ws-ticket/` returns a 60-second ticket; connect to
`/ws/chat/?ticket=...`. Client actions `send`, `read`, `ping`; server pushes `message.created`,
`message.updated`, `message.deleted`, `notification.created`.

## Decisions to know about

- **Group posts are `Post` rows with `group_id`** (visibility `GROUP`), so they get likes,
  comments and moderation for free. `/groups/{id}/feed/` returns them with the `group` and
  `content` fields the Groups UI expects.
- **Events** by regular users are auto-approved; set `EVENTS_REQUIRE_MODERATION=true` to make
  non-organizer events wait for a moderator. `DELETE /events/{id}/` cancels (history is kept).
- **Geo search** uses latitude/longitude with a bounding-box index plus haversine in SQL. GeoDjango
  was not used because it needs GDAL; the PostGIS image is already in `docker-compose.yml` if
  you want to migrate later.
- **Background work**: notifications and badge evaluation run right after the transaction commits
  (`transaction.on_commit`), not in a queue. Celery is not installed; add it when volume needs it.
- **Media** (avatars, post photos, event covers, group images) has two modes, chosen by the environment:
  - **Local (default):** files go to `MEDIA_ROOT` and are served by Django. Fine for development and
    tests, but **lost on hosts with an ephemeral disk** (e.g. Render without a persistent disk).
  - **Cloudinary (persistent):** active only when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
    `CLOUDINARY_API_SECRET` are **all** set (the free tier is enough to start). Uploads then go to
    Cloudinary through `apps/common/storage.py` and the API returns full `https://res.cloudinary.com/...`
    URLs (built without a file extension, because Cloudinary normalises formats, e.g. `.jfif` to jpg). Files
    that were stored locally before Cloudinary was enabled are still served from `/media/` when they exist
    on disk. Tests always use local storage and never call Cloudinary (`config/test_settings.py` forces it).
  - Validation is identical in both modes (`validate_image()`, `MEDIA_MAX_UPLOAD_MB`, default 5 MB).
  - API media URLs are always full URLs. `PUBLIC_API_URL` (optional, empty by default) is only used to
    complete local `/media/...` paths where there is no request, i.e. WebSocket chat payloads; set it
    to the API's public origin if you run local storage behind a different front-end origin.
  - **Switching an existing deployment:** files already stored locally are **not** copied to
    Cloudinary. Database rows keep their old names. While the old files remain on disk they keep loading
    from `/media/`; on a host with an ephemeral disk they are already gone, so those images must be
    re-uploaded (there is no migration script).
  - Deleting an avatar removes it from Cloudinary; replacing an image does not delete the previous
    one yet, and orphaned uploads (never attached to a post) still need a scheduled purge.

## Login performance (measured, no hosting cost change)

Same machine, same code path, in-process (no network), 3 SQL queries per login:

| Step | Before (PBKDF2, 1.2M it) | After (Argon2id) |
|---|---|---|
| user + profile lookup | 3 ms | 3 ms |
| password verify | 1,535 ms | 112 ms |
| JWT + token write | 11 ms | 11 ms |
| **Full login** | **1,588 ms** | **165 ms** (9.6x faster) |
| Over HTTP (valid / wrong pw / unknown email) | 3.4-4.7 s, all equal | 237 / 233 / 228 ms |

97% of the old login time was the password hash; the application code, queries and JWT were
already minimal. The fix is the algorithm, not a weaker setting:

- **Argon2id, 46 MiB, 2 passes, 1 lane** (`config/hashers.py`), tunable with `ARGON2_MEMORY_KIB`,
  `ARGON2_TIME_COST`, `ARGON2_PARALLELISM`. This is OWASP's first-choice algorithm and stronger than
  their listed equivalent (46 MiB, 1 pass). It is memory-hard, so it resists GPU cracking better than
  PBKDF2 at any iteration count. A test fails the build if parameters drop below the OWASP floor.
- **Compatible with existing accounts:** PBKDF2 stays in `PASSWORD_HASHERS`, so existing hashes keep
  working and are re-hashed to Argon2id on that user's next successful login (verified by a test; a failed
  login never rewrites a hash). Only that one first login is slower (one old verify + one new hash).
- **No timing leak:** unknown emails verify against an Argon2id dummy hash, so all failure modes cost the
  same as a real login (HTTP medians within ~4%).
- **Memory-safe on small instances:** at most `PASSWORD_HASH_CONCURRENCY` (default 2) hashes run at once,
  so peak hashing memory is ~92 MiB regardless of request bursts.
- `LOGIN_THROTTLE_RATE` (default `10/min` per IP) is configurable.

Not controllable from code: a sleeping free-tier instance still cold-starts. A free external uptime
ping against `/api/v1/health/` every ~10 minutes keeps it awake. Start the app with
`daphne -b 0.0.0.0 -p $PORT config.asgi:application` (needed for WebSockets).

Query counts are guarded by tests (feed, comments, events, groups, conversations, places: a flat
6-8 queries regardless of page size), so there are no N+1 queries.
