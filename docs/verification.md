# FilmZone verification workflow

Run all automated and frontend verification through Docker Compose. Start with
the smallest relevant checks, then run the complete suite when the change is
ready.

## Expected scope

- Backend changes require focused pytest coverage and the affected tests.
- UI changes require rebuilt assets and browser checks at representative mobile
  and desktop widths.
- Authentication or team-context changes require unauthenticated, wrong-role,
  wrong-team, and valid-access cases.
- Every bug fix or feature change requires the relevant local browser regression
  coverage or a basic browser smoke test, including backend changes that can
  affect startup, sessions, authentication, or rendered routes.

## Browser smoke test

1. Start the application with the development command in
   `docs/development.md`; do not substitute a host-side Flask server.
2. Open `http://localhost:<port>`.
3. Log in with an isolated browser-test user that belongs to a team.
4. Confirm the dashboard renders and its background announcement request
   succeeds, proving active-team context is available.
5. Exercise the route affected by the change at mobile and desktop widths.
6. Inspect the browser console and application-server output for failed
   background requests. A rendered page alone is insufficient.

Do not assume a persistent development admin still has its checked-in password.
Prefer an isolated browser-test user and team. Stored roles are lowercase:
`admin`, `coach`, and `player`.

When a test-setup mistake produces an expected error, identify it explicitly
and inspect logs again from the beginning of the successful run. Do not call a
complete log clean while it contains an unexplained error.

## Test data and cleanup

- Prefer a disposable database or Docker volume for browser-test records.
- If verification must write to the tracked runtime database, first record
  whether it is clean, delete only records created by the verification, and
  report any remaining binary database modification.
- Clean up temporary users, teams, containers, networks, and volumes.
- Restore an exact tracked runtime-data file only when its pre-test state was
  recorded as clean and every modification to it came from the current
  verification run. Otherwise ask before restoring it.

## Redis changes

For Flask-Caching changes, exercise all applicable cases against disposable
live Redis containers:

- URL-based configuration.
- Component host/port/database configuration without authentication.
- Component configuration with `requirepass`.
- Invalid credentials producing a clear production-startup failure.

Flask-Caching authentication tokens and Flask-Limiter counters use separate
stores unless both extensions are configured explicitly.

## Verification evidence

Update the development task document after verification. Under `Verification`,
record:

- Exact commands and automated suites executed.
- Pass/fail counts and warnings.
- Live-service scenarios.
- Browser routes and viewport sizes.
- Browser-console and server-log results.
- Workarounds, skipped checks, and outstanding failures.
- Temporary data and infrastructure cleanup.

Distinguish tests written from tests executed. Do not mark a task complete
merely because coverage was added.
