# FZ-001: Type and validate production configuration

Status: Open  
Priority: High

## Problem

`config/env_config.py` returns environment values as unparsed strings. Boolean values such as `"False"` are truthy, while timeouts, ports, database indexes, session lifetimes, and upload limits may reach Flask or extensions with the wrong type. Production also falls through to `DevConfig`, and `FLASK_SECRET_KEY` has a public default.

## Scope

- Add reusable parsing for boolean and integer environment settings.
- Give each setting an explicit expected type.
- Introduce clear production configuration behavior without relying on the deprecated meaning of `FLASK_ENV`.
- Require a non-default Flask secret in production.
- Validate important settings during application startup and raise a clear error for invalid values.
- Preserve the existing test database selection or replace it with an equally explicit test-mode mechanism.

## Acceptance criteria

- [ ] `SESSION_COOKIE_SECURE=False` is parsed as `False`, not a truthy string.
- [ ] Cache ports/indexes/timeouts, session lifetime, and request-size limits are integers.
- [ ] Production startup fails clearly when `FLASK_SECRET_KEY` is absent or still uses the known development default.
- [ ] Development retains safe, convenient local defaults.
- [ ] Tests select `stats-data/stats-test.db` without depending on ambiguous string truthiness.
- [ ] The production environment variables required by systemd are documented.
- [ ] Focused tests cover valid and invalid boolean/integer parsing plus production secret validation.

## Implementation notes

Prefer explicit helpers such as `get_bool`, `get_int`, and `get_required`. Avoid reading environment variables only once at module import if tests or app factories need to construct configurations with different environments.

Before changing cookie-domain behavior, confirm the live value used for `app.filmzone.ca`. A host-only session cookie may be preferable to setting `SESSION_COOKIE_DOMAIN`.

## Verification

- Run focused configuration tests.
- Start a development app with no production-only variables.
- Attempt production startup without a secret and confirm it fails before accepting requests.
- Start with representative production values and inspect the resulting Flask configuration types.

## Notes

- This task does not change authentication design or password storage.
