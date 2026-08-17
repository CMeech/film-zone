# FZ-005: Harden the active-team cookie

Status: Completed  
Priority: Medium

## Problem

`libs/auth/set_team.py` sets `activeTeamId` as HTTP-only but does not apply Secure or SameSite behavior consistently with the Flask session cookie. Logout also leaves it behind.

The cookie is not itself an authorization grant: `team_required` checks its value against the authenticated profile's team IDs. This task is defense-in-depth and configuration consistency.

## Scope

- Apply configured Secure and SameSite attributes to `activeTeamId`.
- Use an appropriate path and host/domain policy.
- Add a helper to expire the cookie on logout.
- Preserve team selection and redirect behavior.
- Confirm behavior behind nginx at `app.filmzone.ca`.

## Acceptance criteria

- [x] Production sends `activeTeamId` with `HttpOnly`, `Secure`, and the chosen SameSite value.
- [x] Development over HTTP can still select a team.
- [x] Logout expires the active-team cookie.
- [x] The cookie is not sent to unrelated domains or paths beyond the intended scope.
- [x] Missing, malformed, or unauthorized team IDs still cannot establish team context.
- [x] Focused tests inspect set/select/logout cookie headers.

## Implementation notes

Prefer a host-only cookie unless FilmZone intentionally needs to share it across subdomains. Setting `SESSION_COOKIE_DOMAIN=localhost` is not a suitable production default; coordinate this decision with FZ-001.

Do not encode additional trusted user or role information in this cookie. Continue validating the ID through the authenticated server-side profile.

## Verification

- `docker compose -f docker-compose.test.yml run --build --rm app-tests tests/auth/test_active_team_cookie.py tests/auth/test_logout.py tests/configuration/test_config.py`: 30 passed, with 9 existing Flask-Limiter in-memory-storage warnings.
- `docker compose -f docker-compose.test.yml run --rm app-tests`: 45 passed, with 10 existing Flask-Limiter in-memory-storage warnings.
- Focused response-header checks confirmed production `HttpOnly; Secure; SameSite=Strict; Path=/` behavior, no `Domain` attribute, development omission of `Secure`, matching expiry attributes, authorized selection and cached display metadata updates, unauthorized selection rejection, malformed-cookie rejection, and logout expiry.
- Browser smoke test used an isolated development container and disposable `fz005-smoke` volume at `http://localhost:60992`. Admin login and the team-creation page rendered over HTTP. The isolated account had no team, so its dashboard announcement request produced the known missing-active-team 500; the create-team Alpine form also remained disabled during automation, so browser team selection was covered by the focused Flask client test instead of completed through the UI.
- Reviewed `nginx/sites-available/flaskapp`: `app.filmzone.ca` terminates TLS on port 443 and proxies application responses without rewriting `Set-Cookie`. Production now defaults `SESSION_COOKIE_SECURE` to true. A live deployed-domain check was not performed because deployment access was outside this task.
- The isolated container was stopped, its browser tab was closed, and the `fz005-smoke` volume was removed. No browser-test data was written to the tracked database.

## Notes

- FZ-004 and FZ-005 may be implemented together, but retain both acceptance checklists.
- `activeTeamId` is intentionally host-only and uses `Path=/` because team context is consumed across application feature routes. It mirrors the configured session-cookie Secure and SameSite values without sharing the session cookie's configurable domain.
- Production defaults `SESSION_COOKIE_SECURE` to true; an explicit false override remains available only for non-HTTPS diagnostic environments.
