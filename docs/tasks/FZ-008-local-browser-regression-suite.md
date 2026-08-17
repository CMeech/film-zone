# FZ-008: Add a local browser regression suite

Status: Open  
Priority: Medium

## Problem

FilmZone has no repeatable browser-level regression workflow for visual changes or core user interactions. UI modernization currently depends on manual inspection, which makes it difficult to compare mobile and desktop layouts or confirm that forms, navigation, and Alpine behavior still work after template and asset changes.

The application already supports an isolated database through `RUN_TESTS=True`, but the current test Compose volume creates `stats-data/stats-test.db` as a directory and the test service only runs pytest. Browser testing also needs deterministic users, teams, and feature data rather than relying on the development database.

## Scope

- Add Playwright as a local development dependency and provide straightforward install/run commands.
- Run browser tests against an isolated, migrated SQLite database selected explicitly for the test process.
- Seed deterministic administrator, coach, player-access, team, roster, announcement, event, game, and resource metadata needed by the covered screens.
- Capture and compare screenshots at the primary supported viewports:
  - Mobile: `390x844`.
  - Desktop: `1440x900`.
- Cover the principal student-facing pages: access login, dashboard, announcements, games, team calendar, resources, whiteboard, roster, and team selection.
- Add smaller administrator/coach interaction coverage where it protects shared UI behavior, including account login, navigation, team creation, and representative create forms.
- Exercise navigation, form validation/submission, dialogs, menu behavior, and other important Alpine interactions.
- Keep the suite local-first. Continuous-integration setup is explicitly out of scope.
- Do not add backend pytest coverage as part of this task.

## Acceptance criteria

- [ ] A documented command starts FilmZone with an isolated browser-test database and never reads from or writes to `stats-data/stats.db`.
- [ ] The isolated database is created from the current dbmate migrations and populated deterministically.
- [ ] Test setup does not depend on existing local users, cookies, uploads, or database contents.
- [ ] Playwright can authenticate through both coach/admin login and player access-code login.
- [ ] Mobile and desktop screenshot baselines cover the agreed student-facing page matrix.
- [ ] Interaction smoke tests cover navigation, the mobile menu, team selection, and representative forms.
- [ ] Visual failures produce useful diff images and identify the affected page and viewport.
- [ ] Updating approved baselines requires a separate, explicit command.
- [ ] Runtime artifacts such as traces, reports, videos, and failure screenshots are ignored by Git.
- [ ] Approved baseline screenshots are stored in a stable, reviewable repository location.
- [ ] The normal Tailwind and esbuild production builds succeed before the browser suite runs.
- [ ] The local workflow and troubleshooting steps are documented.

## Implementation notes

Prefer Playwright's built-in test runner and screenshot assertions. Keep test helpers small and organized around user roles or workflows rather than mirroring every Flask feature module.

Use a dedicated database path such as `stats-data/stats-playwright.db` instead of overloading the existing pytest database if that makes lifecycle and cleanup clearer. Resolve the current Compose declaration that mounts a named volume at the database file path; a volume should mount the containing directory, or the browser-test process should create its database outside that volume.

Database setup should be deterministic and disposable. Prefer applying the checked-in dbmate migrations followed by an explicit seed script. Do not copy the development database. Resource tests should use dedicated test files and storage paths rather than `resources/` runtime content.

Start the Flask server from Playwright configuration or a small script that sets all required test environment values, waits for `/actuator/health`, and shuts the process down after the run. Use `localhost` consistently unless the session-cookie domain configuration is changed; the current default cookie domain does not work when the browser uses `127.0.0.1`.

The team form currently updates Alpine state through `@change`. Browser helpers must reproduce the real change/blur lifecycle or explicitly dispatch `change` after setting a value. A DOM value alone is not proof that the application component received the event.

Keep screenshot expectations intentional. Stabilize dates, fixture ordering, animations, and other nondeterministic content before capturing baselines. Mask only content that is inherently variable and irrelevant to the assertion.

The initial audit should inventory each covered page in empty and representative populated states, then use those screenshots to decide which states deserve permanent baselines. It is not necessary to snapshot every minor administrative page.

## Verification

- Build browser assets with `npm run build-tailwind` and `NODE_ENV=production npm run build-esbuild`.
- Run the complete Playwright suite at both configured viewports.
- Deliberately alter a visible style and confirm the corresponding screenshot assertion fails with a useful diff.
- Revert that alteration and confirm the suite passes without updating baselines.
- Confirm form tests trigger the same enabled/disabled behavior observed during manual entry.
- Confirm the development database checksum and modification time remain unchanged across a browser-test run.
- Confirm repeated runs start from the same fixture state and do not accumulate records or files.

## Notes

- CI execution, browser-matrix expansion, tablet-specific baselines, and broad backend-test coverage are not included.
- Tailwind and daisyUI remain the UI vocabulary; this task does not introduce a separate design-system layer.
- Generated audit screenshots under `artifacts/` are exploratory evidence, not the final approved Playwright baseline location.
- The initial investigation created untracked screenshots under `artifacts/ui-audit/baseline/`, an isolated `stats-data/stats-test.db`, and a preserved empty Compose-volume directory at `stats-data/stats-test.db.compose-volume-placeholder`. These may still exist when implementation begins. Review them explicitly and decide whether each should be kept, relocated, ignored, or removed; do not commit or delete them without making that decision.
