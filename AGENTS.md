# FilmZone contributor guide

FilmZone is a server-rendered Flask application for coaching high-school boys volleyball. Keep changes small and feature-oriented, and preserve the authorization and active-team boundaries on every request.

## Read first

- See `docs/architecture.md` for the repository map, request lifecycle, data model, deployment details, and known risks.
- The working tree may contain local database, upload, generated asset, IDE, or Docker changes. Do not modify, delete, or commit them unless the task explicitly includes them.
- `static/css/tailwind.css` and `static/js/**` are generated outputs. Edit `assets/css/input.css` and `assets/js/**`, then rebuild.

## Application conventions

- The app factory is `app.create_app()`, with initialization coordinated by `libs/init/init_app.py`.
- Add a feature under `features/<feature>/`, normally separating its blueprint (`*_view.py`), repository (`*_repository.py`), and plain model object.
- Register new blueprints in `features/register_views.py` and use a feature URL prefix.
- Views render Jinja templates or return JSON. Templates live under `templates/<feature>/`; browser code lives under `assets/js/components/<feature>/`.
- Repositories own SQL. Use parameterized queries and the helpers in `features/db/db.py`; use an explicit connection for multi-query transactions.
- Schema changes require a new timestamped dbmate migration under `db/migrations/`. Never edit an already-deployed migration merely to change current schema.
- Game stat JSON must remain compatible with `schemas/game_schema.json`.

## Authentication and tenant isolation

- `@require_auth` must be the outer authorization prerequisite: it resolves the cached token into the request-local profile.
- Add `@pre_authorize([...])` for role-restricted operations. Existing privileged write roles are usually `Role.ADMIN` and `Role.COACH`.
- Add `@team_required` to every team-scoped route. It validates the `activeTeamId` cookie against the authenticated user's team IDs and puts the ID in Flask `g`.
- Decorator order is significant. Follow existing routes: `@route`, `@require_auth`, optional `@pre_authorize`, then `@team_required` (some older routes vary; preserve behavior unless the task is specifically an auth refactor).
- Never trust a team ID, user ID, game ID, event ID, or resource ID just because it came from the browser. Fetch the record and verify it belongs to `get_active_team_id()` before reading, changing, or deleting it.
- Coach login uses username/password; player login uses a shared access code. Both create an opaque token stored in Flask-Caching and put that token in the signed Flask session cookie.
- State-changing browser requests must include the CSRF token from `<meta name="csrf-token">` as `X-CSRFToken` (or submit a protected form).

## Concurrency and state

- Production can serve requests concurrently. Do not put request or user state in module globals. Flask `g` is request-local and is the established location for profile/team context.
- SQLite connections are created per operation. Keep write transactions short; multi-step writes must use one connection and explicitly commit/rollback.
- In-memory `SimpleCache` is process-local. Production authentication requires shared Redis configuration when multiple processes/instances serve traffic.
- File upload and database changes are separate operations today. For new work, handle partial failure and avoid filename collisions within a team.
- Game tracking autosaves a whole JSON document after a debounce. Concurrent editors currently have last-write-wins behavior; do not imply stronger guarantees without adding versioning or locking.

## Frontend and CSP

- UI is SSR Jinja plus Alpine's CSP build. Alpine component expressions must be CSP-compatible; register component behavior in JavaScript rather than adding complex inline expressions.
- The per-request CSP nonce is available as `g.csp_nonce`. Any template script/style tag that needs a nonce should follow the base template pattern.
- GSAP and RxJS are bundled through esbuild. Tailwind 4 and daisyUI scan `assets/` and `templates/` through `assets/css/input.css`.
- Preserve `credentials: 'same-origin'` and the CSRF header on authenticated fetch calls.

## Commands and verification

Development uses the Compose base plus its automatic override:

```sh
docker compose up --build --watch
```

Production-like build/run:

```sh
docker compose -f docker-compose.yml up --build
```

Tests:

```sh
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

If dependencies are installed locally, the quick test is `RUN_TESTS=True PYTHONPATH=. pytest`. Frontend verification is `npm run build-tailwind` followed by `NODE_ENV=production npm run build-esbuild`.

For a backend change, add focused pytest coverage and run the affected tests. For a UI change, rebuild assets and exercise the relevant route in the browser at mobile and desktop widths. For auth/team changes, test unauthenticated, wrong-role, wrong-team, and valid access paths.

## Refactoring guardrails

- Preserve endpoint URLs, response shapes, form field names, and game JSON shape unless the task explicitly permits a breaking change.
- Prefer dependency seams and small repository/view extractions over a broad rewrite.
- Do not silently fix unrelated issues discovered during a task; report them separately.
- Treat `resources/` and `stats-data/` as runtime data, not source fixtures.
