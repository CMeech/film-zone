# FilmZone development tasks

These documents track accepted maintenance work until it is moved into the project's long-term task system. Each task is intentionally small enough to implement and review independently.

## Open tasks

| ID | Task | Priority | Main area |
| --- | --- | --- | --- |
| `FZ-002` | [Upgrade password and access-code hashing](FZ-002-password-hashing.md) | High | Authentication |
| `FZ-003` | [Correct and validate Redis cache configuration](FZ-003-redis-configuration.md) | Medium | Authentication/cache |

## Completed tasks

| ID | Task | Main area |
| --- | --- | --- |
| `FZ-001` | [Type and validate production configuration](completed/FZ-001-typed-production-configuration.md) | Configuration/security |
| `FZ-004` | [Revoke authentication tokens on logout](completed/FZ-004-token-revocation.md) | Authentication |
| `FZ-005` | [Harden the active-team cookie](completed/FZ-005-active-team-cookie.md) | Authentication/team context |
| `FZ-007` | [Preserve resource 403 and 404 responses](completed/FZ-007-resource-http-errors.md) | File resources/error handling |
| `FZ-008` | [Add a local browser regression suite](completed/FZ-008-local-browser-regression-suite.md) | Frontend/testing |

## Explicitly not tracked

The following survey findings are accepted or intentionally ignored and should not be reopened without new requirements:

- SQLite write contention and last-write-wins game editing, given the very small number of writers.
- Broad automated-test expansion, given the application's low stakes and limited feature coupling. Focused verification remains appropriate for the task being changed.
- Historical game migration behavior.
- SQLite foreign-key enforcement.
- Event deletion affected-row reporting.
- Missing-cookie behavior in `use_team`.
- Fail-fast database initialization.

## Task document convention

- Keep the task ID stable if its file is renamed.
- Check acceptance boxes only after implementation and verification.
- Record material design decisions in the task's Notes section.
- Under `Verification`, record what was actually run: commands, automated test
  counts, live-service scenarios, browser routes and viewport sizes, console and
  server-log results, warnings, workarounds, skipped checks, and cleanup.
- Do not mark a task completed merely because verification coverage was added;
  distinguish tests written from tests executed.
- Move completed documents to `docs/tasks/completed/` rather than deleting them.
