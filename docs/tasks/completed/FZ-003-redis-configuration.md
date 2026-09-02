# FZ-003: Correct and validate Redis cache configuration

Status: Completed  
Priority: Medium

## Problem

`libs/cache/cache.py` uses a colon instead of assignment when applying `CACHE_REDIS_PASSWORD`, so password-protected Redis cannot receive that setting. `CACHE_REDIS_URL` is read but unused.

FilmZone currently serves with two threads, so a process-local cache can work for that topology. Redis is still the intended production cache and should be configured deterministically.

## Scope

- Correct the Redis password assignment.
- Define whether production uses a Redis URL or individual host/port/database/password settings.
- Remove or support any currently unused Redis setting.
- Validate cache connectivity during production startup or provide a clear health/diagnostic failure.
- Document that multiple processes or instances require a shared cache for authentication tokens.
- Decide separately whether Flask-Limiter should share Redis storage; include it only if desired during implementation.

## Acceptance criteria

- [x] Password-protected Redis can initialize successfully.
- [x] The selected URL/component configuration has documented precedence.
- [x] Invalid Redis configuration produces a clear startup or diagnostic error.
- [x] Development can continue using `SimpleCache` without Redis.
- [x] The live two-thread deployment remains supported.
- [x] Focused configuration tests verify password and URL/component behavior without requiring a live production Redis instance.

## Implementation notes

Flask-Caching authentication tokens and Flask-Limiter counters are separate stores unless both extensions are configured explicitly. Do not assume configuring one configures the other.

Avoid silently falling back to `SimpleCache` in production when Redis was explicitly requested; that can turn a configuration error into intermittent authentication behavior after a future process-count change.

## Verification

- The documented `docker compose -f docker-compose.test.yml up --build
  --abort-on-container-exit` command passed after correcting its volume target
  and overriding the production image entrypoint with `pytest`.
- An equivalent temporary Compose service using the same built test image ran
  the focused cache/configuration suite: 28 passed.
- The full Dockerized test suite passed: 35 passed, with the existing
  Flask-Limiter in-memory-storage warning.
- Live disposable Redis 7 Alpine containers were exercised successfully both
  without authentication and with `--requirepass`; production cache startup
  connected and issued its validation `PING` in both cases.
- Development `SimpleCache` startup succeeded. An isolated admin and team were
  used to log in through the browser and exercise `/dashboard/`, the dashboard
  announcements request, `/announcements/list`, and its team announcements
  request. All successful-run application requests returned 200 responses.
- The dashboard rendered at 390×844 and 1440×900. The browser console contained
  no warnings or errors after the successful login. Server logs confirmed
  authenticated cache reads and successful background requests.
- One verification-only 500 occurred before the successful run because the
  temporary user was initially seeded with `ADMIN` instead of the stored role
  value `admin`; the seed was corrected and subsequent logs were clean.
- Temporary browser-test records and development/Redis containers were removed.
  The tracked development SQLite file remained byte-modified by its temporary
  transaction even after the records were deleted and was not overwritten.

## Notes

- This task does not require adding workers or changing the current concurrency model.
- `CACHE_REDIS_URL` is authoritative when present; otherwise FilmZone uses the
  individual host, port, database, and optional password settings.
- When updating production configuration, use `CACHE_REDIS_HOST=localhost` for
  a component-based local connection. If using the URL setting instead, provide
  a complete Redis URL such as `CACHE_REDIS_URL=redis://localhost:6379/0`;
  `CACHE_REDIS_URL=localhost` is intentionally invalid because it has no Redis
  URL scheme.
- Production Redis configuration is checked with a `PING` during startup and
  never falls back to `SimpleCache` after a connection or authentication error.
- Flask-Limiter storage remains unchanged and separate from the authentication
  cache.
