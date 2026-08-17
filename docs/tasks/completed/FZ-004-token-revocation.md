# FZ-004: Revoke authentication tokens on logout

Status: Completed  
Priority: Medium

## Problem

Logout removes `session['auth_token']` from the current browser but leaves the server-side cached token valid until its two-hour expiry. A copied token can therefore remain usable after logout.

## Scope

- Remove the current authentication token from Flask-Caching during logout.
- Clear the active-team cookie at the same time.
- Make logout safe when either token or cookie is already absent.
- Decide whether this task should also revoke sessions after password reset; if doing so requires a user-to-token index, document and implement that separately rather than scanning the cache.

## Acceptance criteria

- [x] Logout removes the session token from the browser session.
- [x] Logout deletes the matching cached profile/token.
- [x] Logout expires `activeTeamId`.
- [x] Reusing the old token after logout fails authentication.
- [x] Repeated logout requests complete safely.
- [x] Focused tests cover token presence, cache deletion, and missing-token behavior.

## Implementation notes

Capture the token before calling `session.pop`, then use the existing `remove_from_cache` helper. Consider changing logout to POST for stricter semantics, but preserve the existing endpoint behavior unless that change is explicitly accepted.

Full user-wide revocation after a password or role change is a larger design: the cache currently indexes profiles only by random token, not by user ID.

## Verification

- `docker compose -f docker-compose.test.yml run --build --rm app-tests tests/auth/test_logout.py`: 3 passed, with 3 existing Flask-Limiter in-memory-storage warnings.
- `docker compose -f docker-compose.test.yml run --rm app-tests`: 38 passed, with 4 existing Flask-Limiter in-memory-storage warnings.
- Browser smoke test used an isolated admin and disposable `fz004-smoke` Docker volume at 1440x900 and 390x844. Login reached `/dashboard/`; logout redirected through `/` to `/auth/login/access`; a repeated logout was safe; and a subsequent login succeeded. Server logs recorded cache removal for both authenticated logout requests and invalid-token redirects afterward.
- The first authenticated dashboard announcement request returned 200. After logout correctly removed the pre-existing `activeTeamId` cookie, the isolated admin's next login had no team and the background announcement request returned the repository's known missing-active-team 500; this is outside FZ-004 and was not changed. The browser console otherwise had no logout-related errors.
- The isolated app container was stopped and the `fz004-smoke` volume was removed. No browser-test data was written to the tracked database.

## Notes

- Coordinate active-team cookie attributes with FZ-005.
- Password-reset session revocation is intentionally excluded: it requires a user-to-token index and remains separate work.
