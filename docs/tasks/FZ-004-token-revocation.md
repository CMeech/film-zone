# FZ-004: Revoke authentication tokens on logout

Status: Open  
Priority: Medium

## Problem

Logout removes `session['auth_token']` from the current browser but leaves the server-side cached token valid until its two-hour expiry. A copied token can therefore remain usable after logout.

## Scope

- Remove the current authentication token from Flask-Caching during logout.
- Clear the active-team cookie at the same time.
- Make logout safe when either token or cookie is already absent.
- Decide whether this task should also revoke sessions after password reset; if doing so requires a user-to-token index, document and implement that separately rather than scanning the cache.

## Acceptance criteria

- [ ] Logout removes the session token from the browser session.
- [ ] Logout deletes the matching cached profile/token.
- [ ] Logout expires `activeTeamId`.
- [ ] Reusing the old token after logout fails authentication.
- [ ] Repeated logout requests complete safely.
- [ ] Focused tests cover token presence, cache deletion, and missing-token behavior.

## Implementation notes

Capture the token before calling `session.pop`, then use the existing `remove_from_cache` helper. Consider changing logout to POST for stricter semantics, but preserve the existing endpoint behavior unless that change is explicitly accepted.

Full user-wide revocation after a password or role change is a larger design: the cache currently indexes profiles only by random token, not by user ID.

## Verification

- Log in and confirm an authenticated route succeeds.
- Log out and confirm that same token no longer resolves.
- Confirm the redirect and subsequent login still work.

## Notes

- Coordinate active-team cookie attributes with FZ-005.
