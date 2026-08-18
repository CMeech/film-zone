# FilmZone development workflow

All FilmZone application and project tooling runs through Docker Compose. Do
not run Flask, Python, pytest, npm, dbmate, or frontend tooling directly on the
host.

## Development

Development uses the Compose base plus its automatic override:

```sh
FLASK_SECRET_KEY=local-development-only docker compose up --build --watch
```

Compose interpolates the base file before applying the override, so a
`FLASK_SECRET_KEY` must be present. Use a local-only value and never reuse it in
production.

The first development build may take several minutes while Node, the native
file watcher, and Python dependencies are built. Continued Docker layer
progress is normal.

Open the application at `http://localhost:<port>`, not `127.0.0.1`. The
development session cookie is scoped to `localhost`; using the IP address
prevents the browser from returning it and can cause authentication or CSRF
failures.

## Production-like build

```sh
docker compose -f docker-compose.yml up --build
```

Production configuration is documented in `docs/production-configuration.md`.

## Tests

```sh
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

The test Compose service overrides the production image entrypoint with
`pytest` and mounts its database volume at `/app/stats-data`.

## Frontend assets

`static/css/tailwind.css` and `static/js/**` are generated. Edit
`assets/css/input.css` and `assets/js/**`, then rebuild through the development
bundler service. Do not invoke `npm` directly on the host.

## Browser regression tests

The local Playwright workflow builds the production image (including Tailwind
and esbuild), migrates and resets a dedicated `stats-playwright.db` volume,
seeds deterministic users and feature data, and runs Chromium at `390x844` and
`1440x900`:

```sh
docker compose -f docker-compose.browser.yml up --build \
  --abort-on-container-exit --exit-code-from browser-tests
```

The stack never mounts `stats-data/stats.db` or the runtime `resources/`
directory. It uses separate named volumes and the checked-in browser resource
fixture. Each app start clears and reseeds the browser database, so repeated
runs do not accumulate records. The fixture credentials are `browser-admin` /
`admin-pass`, `browser-coach` / `coach-pass`, and player access code
`player-access`.

Approved screenshots are under `tests/browser/screenshots/`. Update them only
after reviewing a deliberate visual change:

```sh
PLAYWRIGHT_SCRIPT=test:browser:update \
  docker compose -f docker-compose.browser.yml up --build \
  --abort-on-container-exit --exit-code-from browser-tests
```

On failure, inspect `playwright-report/` and `test-results/`; screenshot failures
include expected, actual, and diff images named for the page and viewport.
Traces can be opened from the Playwright container with `npx playwright
show-trace <trace.zip>`. If the browser executable version does not match, keep
the pinned `@playwright/test` package and the `mcr.microsoft.com/playwright`
image tag identical. Remove disposable containers and volumes with:

```sh
docker compose -f docker-compose.browser.yml down --volumes
```

## Runtime data

Treat `resources/` and `stats-data/` as runtime data, not source fixtures. A
persistent development volume may contain accounts or passwords that differ
from checked-in defaults; do not assume the default administrator credentials
still work.
