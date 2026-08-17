# FZ-007: Preserve resource 403 and 404 responses

Status: Completed  
Priority: Low

## Problem

`features/resources/resource_view.py::view_resource` catches all exceptions around calls to `abort(404)` and `abort(403)`. Flask represents those aborts as exceptions, so the handler replaces both expected responses with HTTP 500.

Authorization is still enforced and no file is disclosed, but clients and logs receive the wrong result.

## Scope

- Preserve 404 for a missing resource.
- Preserve 403 for a resource owned by another active team.
- Continue returning 500 for unexpected file or server failures without exposing internal details.
- Keep the existing endpoint and download/view behavior.

## Acceptance criteria

- [x] A nonexistent resource ID returns 404.
- [x] A resource belonging to another team returns 403.
- [x] An authorized PDF is served inline.
- [x] An authorized PPTX is served as an attachment.
- [x] An unexpected missing/corrupt storage failure returns an appropriate server error and is logged.
- [x] Focused route tests cover all cases above.

## Implementation notes

Either perform ownership validation outside the broad `try`, or explicitly re-raise `werkzeug.exceptions.HTTPException`. Keep the ownership check before `send_file`.

## Verification

- `docker compose -f docker-compose.test.yml run --rm app-tests tests/resources/test_resource_view.py`: 5 passed with 5 known Flask-Limiter in-memory-storage warnings.
- `docker compose -f docker-compose.test.yml run --rm app-tests`: 50 passed with 15 known Flask-Limiter in-memory-storage warnings.
- Focused tests cover authenticated 404 and cross-team 403 responses, inline PDF content and headers, attachment PPTX content and headers, and a logged 500 response for a missing stored file.
- Browser smoke test used an isolated `fz004-smoke` Docker volume and test admin/team. `/resources/list` and its partial request returned 200. `/resources/view/999` rendered Flask's native Not Found response and the server returned 404 at 1440x900 and 390x844.
- A clean browser tab showed no console errors or warnings for the successful resource-list and missing-resource run. Server output showed the expected resource 404 plus a 404 for the disposable team's placeholder logo path; no application exceptions occurred.
- Initial setup briefly loaded the dashboard before a team was linked, producing the known missing-active-team announcement error. The successful run was repeated from a clean tab after linking the team and did not reproduce it.
- No tracked runtime data was used. The disposable container and `fz004-smoke` volume were removed after verification.

## Notes

- Do not broaden this task into application-wide error-handler refactoring.
