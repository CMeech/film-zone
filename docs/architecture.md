# FilmZone architecture notes

This document is a code-derived map for future maintenance and refactoring. It describes the repository as surveyed on 2026-08-15; deployment-specific systemd and nginx configuration outside this repository may differ from the checked-in Docker path.

## Runtime overview

```text
Browser
  -> nginx / TLS (production, external configuration)
  -> Flask blueprint route
  -> auth token lookup in Flask-Caching (Redis in multi-process production)
  -> role and active-team checks
  -> repository SQL against SQLite
  -> Jinja HTML or JSON response

Jinja page
  -> generated static/js bundles (Alpine CSP, RxJS, GSAP, feature components)
  -> generated static/css/tailwind.css (Tailwind 4 + daisyUI)
  -> same-origin fetch/form requests with Flask-WTF CSRF protection
```

`app.py` exposes both `create_app()` and the module-level `app` consumed by Gunicorn. `setup_app()` initializes the SQLite file, Flask configuration, cache, limiter, blueprints, template filters, CSRF/CORS, and security headers.

The checked-in production container runs `gunicorn -b 0.0.0.0:5000 app:app`, whose defaults should not be assumed to match the VPS systemd unit. When thread/process behavior matters, inspect the actual systemd `ExecStart` as well.

## Repository map

| Path | Responsibility |
| --- | --- |
| `app.py` | Flask app construction and local entry point |
| `config/` | Environment-backed settings; `RUN_TESTS` selects the test database |
| `features/register_views.py` | Blueprint registration and catch-all redirect |
| `features/<name>/` | Feature routes, SQL repositories, and data objects |
| `libs/auth/` | Authentication, role authorization, and team-context decorators |
| `libs/context/user_context.py` | Request-local profile and active team stored in Flask `g` |
| `libs/cache/cache.py` | Flask-Caching initialization and token-cache helpers |
| `libs/security/` | Flask-Limiter, CSRF, CORS, CSP, and response headers |
| `db/migrations/` | Ordered dbmate SQL migrations for SQLite |
| `schemas/game_schema.json` | Contract for persisted game stat JSON |
| `templates/` | Jinja SSR pages and partials |
| `assets/js/components/` | Source Alpine/JavaScript feature components |
| `assets/js/alpine/` | Alpine CSP bootstrap/source |
| `assets/css/input.css` | Tailwind/daisyUI source entry |
| `static/` | Built browser assets plus committed images |
| `resources/` | Runtime team uploads (PDF/PPTX), not application source |
| `stats-data/` | Runtime/test SQLite files, not application source |
| `tests/` | pytest Flask fixtures and tests; currently minimal |
| `Dockerfile*`, `docker-compose*.yml` | Production build, live development, and containerized tests |

## Feature inventory

- Dashboard: authenticated landing page.
- Users: admin initialization, user/player-access creation, list, team lookup, password reset.
- Teams: admin team creation/linking plus authenticated team selection.
- Rosters: view and add player records to the active team's roster.
- Announcements: active-team list and coach/admin creation, including a partial data endpoint.
- Events: calendar, date-range JSON, coach/admin create and delete.
- Games: active-team list/detail, metadata, film URL, full stat document update, and deletion. The client keeps an offline/localStorage copy and debounces full-document saves.
- Resources: active-team PDF/PPTX upload, list, view/download, and delete; files live on the application filesystem.
- Whiteboard: authenticated interactive browser tool; it is not currently team-scoped or persisted server-side.
- Actuator: unauthenticated `/actuator/health` endpoint used by Docker health checks.

## Authentication and request context

There are two login modes:

1. Coach/admin login hashes a username/password input and verifies it against `Users`.
2. Player login hashes an access code and verifies a user record created for that code.

A successful login builds a `Profile` containing the user, authorized team IDs, opaque token, and display metadata. That profile is cached for two hours. The token is stored as `session['auth_token']` in Flask's signed cookie session. The first associated team is also written to the HTTP-only `activeTeamId` cookie.

For protected requests:

1. `require_auth` reads the session token, looks up the cached profile, and stores it in `g.user_profile`.
2. `pre_authorize` optionally verifies the profile role.
3. `team_required` reads `activeTeamId`, confirms membership in the profile's team IDs, and stores it in `g.active_team_id`.
4. The view/repository must still ensure any addressed record belongs to that active team.

Important consequence: cached profiles are the live authorization source until expiry. Changes to a user's role or team links do not automatically invalidate existing tokens.

## Persistence model

The application uses Python's `sqlite3` directly; there is no ORM. Repositories translate tuples into small model objects and use positional `?` parameters. A new connection is opened for each helper call. Foreign-key enforcement is not explicitly enabled on connections.

Core relationships:

- `Users` many-to-many `Teams` through `UserTeams`.
- `Teams` many-to-many `Players` through `Rosters`.
- `Teams` own announcements, events, games, and uploaded file records.
- Games optionally reference events and store detailed stats as JSON text.

dbmate applies migrations at container startup using `DATABASE_URL=sqlite:stats-data/stats.db`. Migration changes need to be tested both against an empty database and an existing migrated database.

## Frontend lifecycle

Jinja renders the page shell and feature markup. `templates/base-nav/base-nav.html` loads the built GSAP bundle, then the Alpine CSP bundle, and feature templates load their component bundle in the `scripts` block. Components register with `Alpine.data(...)` on `alpine:init`.

`esbuild.config.js` discovers every file under `assets/js/components/**/*.js` and retains its directory/name under `static/js`. In development, the bundler service watches JavaScript, CSS, and templates. In production, a Node build stage emits minified JS/CSS and only the generated results enter the Python image.

The CSP is generated per request. Scripts allow self, the request nonce, and jsDelivr; styles currently allow inline styling because of Tailwind compatibility. YouTube and Office web viewer frames are allowed.

## Deployment and runtime data

- Development: `docker compose up --build --watch` uses `Dockerfile.dev`, Flask debug reload, a source sync, and a separate asset watcher.
- Container production path: multi-stage asset build, dbmate migration, non-root Python user, then Gunicorn.
- Tests: production Dockerfile plus `RUN_TESTS=True`; this changes `DB_FILE` to `stats-data/stats-test.db`.
- VPS production: nginx and systemd are operational dependencies, but the systemd unit is not checked in. The nginx file in this repository is a reference configuration and should be compared with the live host before deployment changes.
- SQLite, uploaded resources, Redis, Flask secret, cookie domain/security, and admin bootstrap values are operational state/configuration. Backups must cover both the SQLite database and `resources/` files.

## Known risks and refactor candidates

These are observations, not changes made by this survey. Prioritize them through focused tasks with tests.

1. **Sparse tests (accepted constraint).** Only the health endpoint has coverage. Given FilmZone's low stakes and limited feature coupling, broad test expansion is not planned; add focused coverage when changing security-sensitive or destructive behavior.
2. **SQLite write contention (accepted constraint).** FilmZone has at most two users who can write and normally only one active user. The current SQLite behavior is adequate for that usage profile.
3. **Shared authentication cache.** `SimpleCache` is process-local. Multiple workers/processes require Redis; otherwise a login token created in one process may fail in another.
4. **Configuration typing.** Environment values are returned as strings, so booleans and integers such as `SESSION_COOKIE_SECURE`, cache ports/timeouts, and size limits are not reliably typed. There is no distinct production config class.
5. **Cache configuration defect.** The Redis password branch uses a type-annotation expression instead of assigning `CACHE_REDIS_PASSWORD`; password-protected Redis will not receive that setting.
6. **Authorization consistency.** Team membership is checked by decorators, but record ownership checks vary by feature/repository. Centralized team-scoped repository queries would make cross-team access harder to introduce.
7. **Token lifecycle.** Logout removes the cookie session value but does not delete the cached token. Role/team/password changes also leave cached profiles valid until their two-hour expiry.
8. **Upload consistency.** A same-named team file can overwrite an existing file, and filesystem/database operations are not atomic. The production Compose file persists SQLite but does not mount `resources/`, so uploads made in that container are not durable across replacement.
9. **Game concurrent editing (accepted constraint).** Full game JSON is saved with last-write-wins semantics. This is acceptable for FilmZone's single-active-editor usage profile.
10. **Migration integrity.** The initial migration creates `Games` before `Events`, and the home-flag migration drops/recreates `Games`, losing existing data. Its down migration recreates the same newer shape rather than restoring the previous one.
11. **Error handling.** Some broad exception handlers convert expected HTTP errors into 500 responses or log and continue after initialization failures. Standard error responses and fail-fast startup would improve diagnosis.
12. **Cookie hardening.** The active-team cookie is HTTP-only but does not explicitly mirror Secure/SameSite settings. Flask's session cookie is signed, not encrypted; sensitive profile data should remain server-side as it does now.

## Suggested sequence for larger modernization

1. Build a test harness that creates a temporary migrated SQLite database and deterministic users/teams.
2. Add authorization and cross-team isolation tests around every feature.
3. Centralize typed configuration and production validation.
4. Harden SQLite connection/transaction behavior and decide whether SQLite remains the intended concurrent production store.
5. Centralize team-scoped repository methods and token invalidation.
6. Make resource storage durable/transaction-aware and add safe unique object names.
7. Add optimistic concurrency to game stat saves if simultaneous editing is a real workflow.

Keep these as separate, reviewable changes rather than one application-wide rewrite.
