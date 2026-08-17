# FZ-003: Correct and validate Redis cache configuration

Status: Open  
Priority: Medium

## Problem

`libs/cache/cache.py` uses a colon instead of assignment when applying `CACHE_REDIS_PASSWORD`, so password-protected Redis cannot receive that setting. `CACHE_REDIS_URL` is read but unused.

FilmZone currently serves with two threads, so a process-local cache can work for that topology. Redis is still the intended production cache and should be configured deterministically.

## Scope

- Correct the Redis password assignment.
- Define whether production uses a Redis URL or individual host/port/database/password settings.
- Remove or support any currently unused Redis setting.
- Validate cache connectivity during production startup or provide a clear health/diagnostic failure.
- Document that multiple processes or instances require a shared cache for authentication tokens.
- Decide separately whether Flask-Limiter should share Redis storage; include it only if desired during implementation.

## Acceptance criteria

- [ ] Password-protected Redis can initialize successfully.
- [ ] The selected URL/component configuration has documented precedence.
- [ ] Invalid Redis configuration produces a clear startup or diagnostic error.
- [ ] Development can continue using `SimpleCache` without Redis.
- [ ] The live two-thread deployment remains supported.
- [ ] Focused configuration tests verify password and URL/component behavior without requiring a live production Redis instance.

## Implementation notes

Flask-Caching authentication tokens and Flask-Limiter counters are separate stores unless both extensions are configured explicitly. Do not assume configuring one configures the other.

Avoid silently falling back to `SimpleCache` in production when Redis was explicitly requested; that can turn a configuration error into intermittent authentication behavior after a future process-count change.

## Verification

- Exercise development with `SimpleCache`.
- Exercise Redis without a password.
- Exercise Redis with authentication enabled.
- Log in, make authenticated requests across both server threads, and confirm the profile remains available.

## Notes

- This task does not require adding workers or changing the current concurrency model.
