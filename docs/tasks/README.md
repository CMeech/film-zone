# FilmZone development tasks

These documents track accepted maintenance work until it is moved into the project's long-term task system. Each task is intentionally small enough to implement and review independently.

## Open tasks

| ID | Task | Priority | Main area |
| --- | --- | --- | --- |
| `FZ-001` | [Type and validate production configuration](FZ-001-typed-production-configuration.md) | High | Configuration/security |
| `FZ-002` | [Upgrade password and access-code hashing](FZ-002-password-hashing.md) | High | Authentication |
| `FZ-003` | [Correct and validate Redis cache configuration](FZ-003-redis-configuration.md) | Medium | Authentication/cache |
| `FZ-004` | [Revoke authentication tokens on logout](FZ-004-token-revocation.md) | Medium | Authentication |
| `FZ-005` | [Harden the active-team cookie](FZ-005-active-team-cookie.md) | Medium | Authentication/team context |
| `FZ-006` | [Make resource storage durable and internally consistent](FZ-006-resource-storage.md) | Medium | File resources |
| `FZ-007` | [Preserve resource 403 and 404 responses](FZ-007-resource-http-errors.md) | Low | File resources/error handling |

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
- Move completed documents to `docs/tasks/completed/` rather than deleting them.
