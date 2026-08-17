# FZ-006: Make resource storage durable and internally consistent

Status: Open  
Priority: Medium

## Problem

Uploaded PDF/PPTX resources are stored under `resources/<team-id>/<original-filename>`. Re-uploading a name overwrites the physical file while inserting another database record. Filesystem and database operations can also partially succeed independently.

Production runs directly on the VPS, so the Docker volume concern is not applicable to that deployment. Operational backups must nevertheless include both SQLite and `resources/`.

## Scope

- Separate the user-visible original filename from a collision-resistant storage name.
- Prevent one upload from unintentionally overwriting another resource.
- Clean up a newly written file if database creation fails.
- Define safe deletion ordering and partial-failure behavior.
- Document backup and restore requirements for the database plus resource files.
- Confirm the deployment process preserves the resource directory.

## Acceptance criteria

- [ ] Two uploads with the same original filename remain independently retrievable.
- [ ] Resource listings and downloads show/use the expected original filename.
- [ ] A failed database insert does not leave a new orphan file.
- [ ] A failed file deletion does not silently remove the database's only recovery reference.
- [ ] Paths remain confined to the configured team resource directory.
- [ ] Backup documentation covers SQLite and `resources/` as one logical dataset.
- [ ] Focused tests use a temporary upload directory and database.

## Implementation notes

Likely schema work includes an immutable storage name/path and an original display filename. Add a new dbmate migration; do not rewrite old migrations.

Generate storage names with a UUID or another server-controlled identifier. `secure_filename` is still useful for display/download names but should not be the uniqueness mechanism.

True atomicity is not available across SQLite and the filesystem. Use compensation:

1. Write to a temporary or unique final path.
2. Insert the database record.
3. Remove the file if insertion fails.

For deletion, consider marking/removing the database row only after the file operation succeeds, while returning a clear error that permits retry.

## Verification

- Upload duplicate filenames and retrieve both records.
- Simulate repository failure after file write and verify cleanup.
- Simulate missing-file deletion and verify the chosen behavior.
- Restore a test backup containing both database and files.

## Notes

- Allowed file types remain PDF and PPTX unless a separate feature request changes them.
