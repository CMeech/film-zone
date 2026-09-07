# Set Explorer technical implementation plan

## Status

Draft for technical review. This plan translates the product requirements in
[`set-explorer.md`](set-explorer.md) into a proposed FilmZone implementation.
It does not include production code.

## Recommended architecture

Set Explorer should be an authenticated, client-rendered feature inside the
existing Flask application. Flask serves the page and enforces authentication;
all scene state, curve generation, animation, camera control, and URL sharing
run in the browser.

```text
GET /set-explorer/
    -> @require_auth
    -> Jinja page shell
    -> bundled Set Explorer JavaScript
    -> Three.js scene and browser-only state
```

The first release requires no database migration, repository, JSON endpoint,
CSRF-protected mutation, team-specific data, or change to the game schema.

## Dependency decision

Use Three.js as a locally bundled npm dependency. Pin it to an exact version in
`package.json` and `package-lock.json` when implementation begins. Import
`OrbitControls` from the matching Three.js addons package path.

Do not load Three.js from a CDN. Local bundling fits the existing esbuild
pipeline, avoids adding a runtime network dependency, and works with the
current `script-src 'self'` content-security policy.

Do not add a physics engine, React, React Three Fiber, or a second UI framework.
Use Three.js for rendering and raycasting, OrbitControls for camera input, and
plain JavaScript modules for feature behavior. The final page may use simple
Alpine expressions for ordinary UI state if they remain CSP-compatible, but
Three.js scene state must not depend on Alpine reactivity.

Use custom raycast-and-plane dragging rather than Three.js `DragControls`.
There are only two draggable objects, and custom handling gives the feature
explicit ownership of touch cancellation, court-plane projection, selection,
and OrbitControls enablement.

## Proposed repository structure

```text
features/set_explorer/
  set_explorer_view.py

templates/set-explorer/
  set-explorer.html

assets/js/components/set-explorer/
  set-explorer.js                 # esbuild entry and page bootstrap

assets/js/features/set-explorer/
  calibration.js                  # dimensions, targets, angles, limits, timing
  state.js                        # canonical state and animation transitions
  trajectory.js                   # deterministic curve construction
  scene.js                        # Three.js objects, renderer, camera, resize
  interaction.js                  # picking, dragging, orbit ownership
  url-state.js                    # query parsing, validation, clearing, sharing

tests/set_explorer/
  test_set_explorer_view.py

tests/browser/
  set-explorer.spec.js
  screenshots/mobile/set-explorer.png
  screenshots/desktop/set-explorer.png
```

Files under `assets/js/components/**` are automatically treated as separate
esbuild entry points. Internal modules therefore belong under
`assets/js/features/**` and are imported by the single component entry. This
avoids emitting unused standalone bundles for implementation modules.

The exact module split may be collapsed during implementation if a module
would remain trivial. Preserve the responsibility boundaries even if fewer
physical files are used.

## Flask and template integration

### Route

Create a `set_explorer_bp` blueprint and register it in
`features/register_views.py` with the prefix `/set-explorer`.

The page route should be:

```text
GET /set-explorer/
```

Apply `@require_auth`. Do not apply `@team_required` in the first release
because the page does not read or write team-owned state. This matches the
current whiteboard's access model. If team data is introduced later, revisit
the route boundary rather than relying on the current decision.

### Navigation

Add `Set Explorer` to the authenticated sidebar and dashboard quick actions.
It should remain a separate feature from `Whiteboard` so each tool has a clear
purpose.

### Template

The page extends `base-nav/base-nav.html` and loads only the generated Set
Explorer entry bundle. The template owns semantic controls and responsive
layout containers. JavaScript owns the canvas, live values, and interaction
behavior.

The template should expose stable element IDs or data attributes for the scene,
position buttons, height buttons, force input, playback controls, camera
controls, share action, reset actions, and mobile sheet. Do not put complex
behavior in inline Alpine expressions.

## Coordinate system

Use metres as the sole internal unit.

Recommended world axes:

```text
x: attacking team's left sideline -> right sideline
y: floor -> upward
z: net -> attacking team's back court
```

Recommended origin:

```text
(0, 0, 0) = attacking team's left sideline at the net
```

The attacking half court occupies:

```text
x = 0.0 .. 9.0
y = 0.0 .. scene height
z = 0.0 .. 9.0
```

The net lies on `z = 0`. Camera location and rotation never change the meaning
of the axes or numbered positions.

Fixed target lateral coordinates use:

```text
x = (position - 0.5) * (courtWidth / 9)
```

On a 9-metre court, positions 1, 3, 5, 7, and 9 resolve to `0.5`, `2.5`, `4.5`,
`6.5`, and `8.5` metres. Their default `z` value is the calibrated target
offset from the net.

Position 6 is computed from the setter:

```text
target.x = setter.x + 0.762
target.z = calibrated default net offset
```

The positive `x` direction is the back-set direction toward the attacking
team's right side. "Behind" describes the team's set terminology, not the
setter model's current facing direction; the model rotates to face the computed
target. When position 6 is snapped, moving the setter recomputes the target's
lateral coordinate. Dragging the target changes its mode to custom and breaks
the dynamic relationship until position 6 is selected again.

All values received from pointer projection or URL parameters are clamped in
world coordinates before they enter canonical state.

## Centralized calibration

Keep coaching values in one immutable configuration module rather than
scattering numbers through rendering and control code.

The configuration should group:

- Court width, court depth, attack-line distance, and line width.
- Net height, net width, tape size, antenna dimensions, and ball radius.
- Default setter position and release-point offset.
- Setter and endpoint movement bounds.
- Position lane formula and default net offset.
- Position 6 distance.
- Height-level release angles.
- Contact-point height above the net.
- Force limits and force-to-duration mapping.
- Custom-position label tolerance.
- Camera poses and OrbitControls limits.
- Animation completion pause.
- Visual sizes and invisible pointer-hit radii.

Keep display-unit conversion at the UI boundary. Geometry always consumes
metres and animation always consumes seconds.

## Canonical state

Maintain one serializable set state independent of Three.js objects:

```text
setState
  setter: { x, z }
  target:
    mode: "standard" | "position6" | "custom"
    position: 1 | 3 | 5 | 6 | 7 | 9 | null
    x
    z
  height: 1 | 2 | 3
  force: number
  cameraView: "end" | "left" | "middle" | "right" | "opposition"
```

Contact height, release offset, court dimensions, and other coaching constants
come from calibration rather than URL state.

Maintain animation and transient interaction separately:

```text
animationState
  status: "ready" | "playing" | "paused" | "complete"
  progress: 0.0 .. 1.0
  startedAt
  elapsedBeforeStart

interactionState
  selection: "setter" | "target" | null
  activePointerId: number | null
  dragPlane
  sharedUrlIsPristine: boolean
```

Do not store Three.js meshes, vectors, controls, renderers, DOM nodes, or
animation-frame IDs in the serializable state.

## State transitions

All user actions should go through explicit controller operations rather than
mutating meshes directly.

### Set edits

Selecting a position, changing height or force, or committing a setter/target
drag performs this sequence:

1. Cancel the active animation frame's playback state.
2. Update and clamp canonical set state.
3. Recompute a snapped target if its mode is `position6`.
4. Rebuild the curve and trajectory preview.
5. Return the ball to the updated release point.
6. Rotate the setter toward the target.
7. Update labels and control values.
8. Clear loaded query parameters if this is the first shared-state edit.

Dragging should update geometry continuously for visual feedback, but URL
clearing and other commit-only effects should run once when the drag ends.

### Playback

- `ready -> playing`: begin at progress zero.
- `playing -> paused`: retain the current progress and elapsed time.
- `paused -> playing`: resume without jumping.
- `playing -> complete`: retain the ball briefly at the contact point.
- `complete -> playing`: reset progress to zero and begin again.
- Any set edit or reset: transition to `ready` at the release point.
- Page hidden while playing: transition to `paused`.

Use `requestAnimationFrame` timestamps. Do not advance with accumulated frame
counts or `setInterval`, because frame rates and background-tab behavior vary.

Only one animation-frame loop may own ball movement. Repeated play clicks must
not create overlapping loops.

## Force mapping

Force controls total travel duration, not curve shape. Represent it in state as
a bounded UI value, likely `0 .. 100`, and map it monotonically to calibrated
minimum and maximum durations.

A preliminary mapping can be linear for the proof of concept:

```text
duration = maxDuration - (force / 100) * (maxDuration - minDuration)
```

Keep the mapping behind one function so calibration can later use a nonlinear
curve without changing state, URLs, controls, or animation code.

Do not infer force from setter-to-target distance. A chosen force produces the
configured duration even when the target moves; this preserves the agreed
independence between force and trajectory geometry.

## Trajectory construction

Use a cubic Bézier curve with four world-space points:

```text
P0 = setter release point
P1 = release tangent control point derived from the height angle
P2 = arrival control point derived from target direction and contact height
P3 = hitter contact point
```

The release tangent points horizontally toward the target and upward at 45,
52, or 60 degrees. Its handle length should scale within bounded limits based
on horizontal setter-to-target distance. The arrival control point should
produce a visually useful descending or flattening approach without changing
the contact point.

Curve construction must handle:

- Very short setter-to-target distances.
- Long outside sets.
- Targets in front of and behind the setter.
- Setter and target at nearly identical horizontal coordinates.
- Targets tight to and away from the net.
- A setter moved near court boundaries.

Validate each candidate curve before display. At minimum, sample it to reject
or adjust excessive apex height, movement below allowed height, non-finite
coordinates, unintended court reversal, and net intersection. Prefer clamping
control-handle lengths to presenting an error state.

Render the preview with a sampled line or tube whose segment count is fixed and
modest. The ball uses `curve.getPointAt(progress)` so apparent travel follows
arc length more evenly than a raw curve parameter.

## Setter representation and orientation

The exact visual representation remains a coaching/design decision. The
technical interface should treat it as a grouped Three.js object with:

- A world-space floor position.
- A stable release-point child marker above the forehead.
- A separate visible floor-ring selection indicator.
- A larger invisible floor-level raycast target.
- Horizontal rotation around the vertical axis.

After either endpoint moves, rotate the setter group to face the horizontal
target direction. All trajectories, including back sets, start from the same
release marker above the setter. Do not shift the release marker based on set
direction.

The initial proof of concept should use simple geometry or a lightweight
stylized figure. A detailed animated character model adds asset, loading,
orientation, and mobile-performance risks without validating the core feature.

## Input and gesture ownership

Process pointer input through one interaction controller.

### Pointer priority

1. UI controls and the mobile sheet consume gestures that begin within them.
2. A raycast hit on the setter floor handle begins a setter drag.
3. A raycast hit on the target handle begins a target drag.
4. A pointer gesture on empty canvas belongs to OrbitControls.
5. A second pointer cancels object dragging and yields to OrbitControls zoom.

Object dragging uses pointer capture and an invisible `y = 0` court plane.
Target dragging projects to the same plane for `x` and `z`, then restores the
fixed contact-point `y`. Disable OrbitControls only for the duration of an
object drag and restore it on pointer-up, pointer-cancel, lost capture, window
blur, and component teardown.

Distinguish click selection from dragging with a small screen-space movement
threshold. Increase raycast hit areas without increasing the visible object
size. Mouse hover may provide a cursor or highlight, but hover cannot be
required to discover dragging on phones.

Do not use a delayed long press for ordinary dragging unless physical-device
testing proves accidental movement is a real problem; delay can make the tool
feel unresponsive.

## Camera and resizing

Define camera presets as calibrated position, look-at target, zoom/distance,
and OrbitControls target values. Selecting a preset animates briefly to that
pose and updates `cameraView`. Free orbit after selection changes the live
camera but does not change the named value stored in share state.

Constrain vertical orbit so the camera cannot pass under the court. Clamp zoom
so the court cannot become microscopic or clip through the setter and net.

Use `ResizeObserver` on the visible scene container, not only `window.resize`.
The renderer, camera aspect ratio, and pixel ratio must update when:

- The browser resizes or rotates.
- The sidebar changes available width.
- The mobile control sheet opens or closes.
- Full-screen or distraction-free mode changes.

Cap renderer pixel ratio on high-density phones to protect performance.
Reframe only when a layout transition would hide the setter or target; do not
discard a user's free camera adjustments after every resize.

## Responsive UI

### Phone

Use a scene-first layout with persistent play/pause and compact primary status.
A bottom sheet contains position, height, force, camera, share, and reset
controls. The sheet has collapsed and expanded states and scrolls internally
when necessary.

Do not make the sheet itself horizontally draggable: horizontal gestures must
remain unambiguous for buttons and the force range input. Expand or collapse it
through a handle/button with an explicit vertical interaction.

### Desktop and large screen

Use a persistent side control panel beside the scene. Keep the scene large
enough for presentation and provide a distraction-free full-screen mode. If
the Fullscreen API is unavailable, hide surrounding navigation and expand the
feature within the document instead.

Use the same underlying controls and state operations in both layouts. Do not
maintain separate mobile and desktop implementations.

## URL state

Use a compact allow-listed query format. Proposed keys:

```text
p   target position or "c" for custom
h   height level
f   force
sx  setter x
sz  setter z
tx  target x, when custom
tz  target z, when custom
v   named camera view
```

Position 6 does not require target coordinates while snapped because it can be
recomputed from the setter. Custom coordinates must be present as a pair; a
partial pair falls back to the default target.

Parsing rules:

- Read only known keys.
- Reject non-finite values.
- Clamp numeric values to calibration bounds.
- Restrict enumerations to allow-listed values.
- Round serialized coordinates to a stable, sufficient precision.
- Fall back to the complete default state when meaningful reconstruction is
  impossible.

On initial load, apply validated URL state before the first meaningful render.
Mark it pristine. The first edit to setter, target, position, height, force, or
named camera view calls `history.replaceState` with the same path and no query
string. Playback, pause, selection, sheet state, and free orbit do not clear
the query.

The share action always serializes the current canonical state into a newly
constructed URL and copies it. It does not need to mutate the current address.
Show a short copied or copy-failed status in the page.

No schema-version parameter or old-link compatibility layer is required.

## Rendering lifecycle and cleanup

The page controller owns initialization and teardown:

1. Confirm WebGL and required browser APIs are available.
2. Parse the initial URL and construct canonical state.
3. Create renderer, scene, camera, controls, and scene objects.
4. Construct the initial curve and synchronize controls.
5. Attach DOM, pointer, visibility, resize, and full-screen listeners.
6. Render on animation frames while playing, camera controls are damping, a
   camera transition is active, or the scene is dirty.

Avoid an unconditional permanent 60-fps loop when the scene is idle. An
on-demand render loop reduces phone battery and heat. Teardown cancels the
animation frame, disposes geometries/materials/renderer, disconnects observers,
and removes global listeners.

## Error handling

- If WebGL or renderer creation fails, replace the scene with a short fallback
  while keeping FilmZone navigation usable.
- If a shared URL is invalid, use defaults rather than blocking the page.
- If clipboard writing is unavailable or denied, expose the generated link for
  manual copying.
- If full-screen entry fails, retain the normal layout.
- Log unexpected initialization failures once; do not flood the console from
  the render loop.

## Verification plan

All builds and tests run through Docker Compose as required by the repository.

### Flask coverage

Add focused tests proving:

- An unauthenticated request is redirected through the established login flow.
- An authenticated player can load the page.
- The route renders the expected scene root and bundle reference.
- No active-team cookie is required for this non-team-scoped first release.

### Browser logic and interaction coverage

Prefer testing observable behavior through Playwright. If curve and URL helpers
become complex enough to require direct unit coverage, add a small Node test
runner only as a separate, deliberate tooling decision; do not introduce one
solely to test trivial functions.

Playwright should cover:

- Page load and visual snapshots in the existing mobile and desktop projects.
- Position and height selection and generated labels.
- Position 6 following setter movement, then breaking into custom mode after a
  target drag.
- Force changing duration without changing sampled path geometry.
- Play, pause, resume, completion, replay, reset, and edit-during-playback.
- Setter and endpoint pointer dragging.
- Camera preset selection and camera reset.
- Valid shared URL reconstruction.
- Invalid and extreme query-value handling.
- Query removal on the first state edit but not on playback or camera orbit.
- Share-link generation from current state.
- Opening and closing mobile controls without hiding essential scene objects.
- No unexpected browser-console or application-server errors.

WebGL screenshots can vary across rendering environments. Keep materials,
lighting, antialiasing, shadows, and animations deterministic. Pause animation
and camera transitions before visual snapshots. Prefer assertions on state and
DOM labels for precise behavior, with screenshots covering overall layout.

### Manual verification

- Use a physical phone to validate pinch, drag, pointer cancellation, sheet
  controls, device rotation, performance, and heat.
- Use the intended large display to validate line thickness, ball visibility,
  labels, camera poses, and presentation mode.
- Review every height at short, long, front, and back targets.
- Confirm a player can distinguish the intended set shapes without seeing the
  generated label.

## Delivery slices

### Slice 1: Technical spike

Build only enough to validate risk:

- Court, net, simple setter, ball, endpoint, and trajectory preview.
- Central calibration and canonical state.
- Setter and endpoint dragging with camera orbit and zoom.
- Height selection, force, and play/pause animation.
- Position 6 behavior.
- Named camera poses.
- Phone-sized interaction test on a physical device.

Exit criterion: the interaction feels reliable and all required curve shapes
can be calibrated without changing the architecture.

### Slice 2: Integrated frontend MVP

- Authenticated FilmZone route and navigation.
- Responsive production UI and mobile sheet.
- Complete state transitions and reset behavior.
- URL loading, clearing, and share generation.
- Rendering lifecycle, fallback behavior, and error handling.
- Focused Flask and browser coverage.

Exit criterion: all first-release acceptance criteria in the product
specification pass except coaching validation.

### Slice 3: Coaching calibration and release

- Tune the unresolved calibration values.
- Validate every set family and camera view with the coach.
- Test on a physical phone and review display.
- Record verification evidence and update approved screenshots.
- Update both feature documents to match shipped behavior.

Exit criterion: the coach accepts the set shapes and the delivery checklist is
complete.

## Main risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Curves look wrong at extreme positions | Centralize calibration, clamp inputs, and validate sampled curves in the spike |
| Touch dragging fights camera orbit | Use explicit pointer priority, capture, cancellation, and oversized raycast targets |
| Position 6 becomes inconsistent | Represent standard, position-6, and custom targets as explicit modes |
| Mobile rendering drains battery | Cap pixel ratio and render on demand while idle |
| Bottom sheet hides the manipulated object | Observe the scene container and preserve essential framing after layout changes |
| Force is mistaken for physical measurement | Describe timing as estimated and keep the mapping calibratable |
| WebGL screenshots are unstable | Use deterministic rendering and prefer behavioral assertions for precise tests |
| Shared links produce unsafe state | Allow-list, validate, and clamp every query value before state construction |

## Decisions intentionally deferred to the spike

- Default setter court position.
- Setter release-point height.
- Exact contact height within the agreed 1.5-to-2-foot range.
- Force-to-duration minimum, maximum, and curve.
- Exact setter and target drag bounds.
- Final setter visual design.
- Final camera coordinates and zoom limits.
- Custom-target label tolerance.
