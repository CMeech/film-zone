# FZ-007: Preserve resource 403 and 404 responses

Status: Open  
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

- [ ] A nonexistent resource ID returns 404.
- [ ] A resource belonging to another team returns 403.
- [ ] An authorized PDF is served inline.
- [ ] An authorized PPTX is served as an attachment.
- [ ] An unexpected missing/corrupt storage failure returns an appropriate server error and is logged.
- [ ] Focused route tests cover all cases above.

## Implementation notes

Either perform ownership validation outside the broad `try`, or explicitly re-raise `werkzeug.exceptions.HTTPException`. Keep the ownership check before `send_file`.

This task can be implemented independently of the larger storage changes in FZ-006.

## Verification

- Run focused Flask client tests with authenticated profiles for the owning and non-owning teams.
- Manually verify PDF and PPTX response headers if FZ-006 changes stored filenames.

## Notes

- Do not broaden this task into application-wide error-handler refactoring.
