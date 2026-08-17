# FZ-005: Harden the active-team cookie

Status: Open  
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

- [ ] Production sends `activeTeamId` with `HttpOnly`, `Secure`, and the chosen SameSite value.
- [ ] Development over HTTP can still select a team.
- [ ] Logout expires the active-team cookie.
- [ ] The cookie is not sent to unrelated domains or paths beyond the intended scope.
- [ ] Missing, malformed, or unauthorized team IDs still cannot establish team context.
- [ ] Focused tests inspect set/select/logout cookie headers.

## Implementation notes

Prefer a host-only cookie unless FilmZone intentionally needs to share it across subdomains. Setting `SESSION_COOKIE_DOMAIN=localhost` is not a suitable production default; coordinate this decision with FZ-001.

Do not encode additional trusted user or role information in this cookie. Continue validating the ID through the authenticated server-side profile.

## Verification

- Inspect cookie attributes in a local browser and through production-like HTTPS/nginx.
- Select between authorized teams and confirm the cached profile display metadata follows the selection.
- Log out and confirm the cookie is absent or expired.

## Notes

- FZ-004 and FZ-005 may be implemented together, but retain both acceptance checklists.
