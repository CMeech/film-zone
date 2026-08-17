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

## Runtime data

Treat `resources/` and `stats-data/` as runtime data, not source fixtures. A
persistent development volume may contain accounts or passwords that differ
from checked-in defaults; do not assume the default administrator credentials
still work.
