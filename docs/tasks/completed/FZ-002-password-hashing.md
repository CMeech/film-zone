# FZ-002: Upgrade password and access-code hashing

Status: Completed  
Priority: High

## Problem

Coach passwords and player access codes are stored as a single unsalted SHA-256 digest through `libs/hash/generate_token.py`. This is fast to guess offline if the SQLite database or a backup is exposed.

The same helper also creates opaque login tokens. Password hashing and token generation have different requirements and should not share a misleading abstraction.

## Scope

- Use a password-hashing function intended for stored credentials, preferably Werkzeug's `generate_password_hash` and `check_password_hash`.
- Apply the stronger storage format to coach passwords and player access codes.
- Preserve existing users through a gradual legacy-hash migration.
- Separate credential hashing/verification from opaque access-token generation.
- Ensure password resets use the new format.

## Acceptance criteria

- [x] Newly created and reset credentials are salted and use a slow password hash.
- [x] Existing 64-character SHA-256 credentials can still authenticate during migration.
- [x] A successful legacy login upgrades that stored credential to the new format.
- [x] Authentication tokens remain opaque and unpredictable without being processed as password hashes.
- [x] Logs never contain raw passwords, access codes, or stored credential hashes.
- [x] Focused tests cover new hashes, valid/invalid login, legacy login, and legacy upgrade.

## Implementation notes

The current repository verification methods compare hashes directly in SQL. Strong salted hashes require fetching the candidate user record first and verifying the submitted secret in Python.

Player access records have no username. If multiple records can share an access code, define whether the first match remains acceptable. A straightforward migration may need to scan player-access records because salted hashes cannot be queried by equality.

Consider renaming `generate_token` to reflect its remaining token-specific purpose or replacing it with `secrets.token_urlsafe`. Do not store raw authentication tokens in logs.

## Verification

- Focused credential tests cover new salted hashes, coach and player login,
  successful legacy upgrades, failed legacy attempts, and password resets.
- Token tests confirm authentication tokens use a separate opaque,
  unpredictable generator.
- Exact historical test commands and counts were not recorded in this task
  document when the implementation was completed.

## Notes

- Online guessing protection remains the responsibility of rate limiting and sufficiently strong user-selected credentials.
