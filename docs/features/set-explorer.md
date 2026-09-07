# Set Explorer feature specification

## Status

Draft for product and coaching review. This document defines the intended user
experience and first-release boundaries; it does not authorize implementation
details that conflict with FilmZone's architecture or security conventions.

## Delivery checklist

This is the primary progress tracker for the feature. Check an item only when
the decision is recorded in this specification or the work has been completed
and verified. More detailed requirements and acceptance criteria appear in the
sections below.

### Product decisions

- [x] Define the feature as a focused set-shape explorer rather than a rotation
  or blocking simulator.
- [x] Define positions 1, 3, 5, 7, and 9 from nine equal court-width lanes.
- [x] Define position 6 as approximately 2.5 feet behind the setter.
- [x] Define height 1, 2, and 3 release angles as approximately 45, 52, and 60
  degrees.
- [x] Make the setter and contact point movable on constrained planes.
- [x] Place the setter's default lateral position in lane 6 of the nine-lane
  court-width grid.
- [x] Derive the release point above the setter's forehead.
- [x] Allow the setter's height to be configured.
- [x] Set the net height to 7 feet 11.75 inches.
- [x] Keep contact height fixed in the first release.
- [x] Make force control travel speed without changing trajectory geometry.
- [x] Use deterministic curves instead of a physics simulation.
- [x] Support play, pause, and resume without a separate playback-speed control.
- [x] Define the five named camera views.
- [x] Use URL query parameters for sharing and remove them after an edit.
- [x] Remove coach-saved presets from the planned scope.
- [x] Set the setter's default distance from the net to 2 feet.
- [x] Set the configurable setter-height range to 5 feet 2 inches through 6
  feet 4 inches.
- [x] Choose 5 feet 10 inches as the default selected setter height.
- [ ] Choose the release offset above the setter's forehead.
- [ ] Choose the default contact height between 1.5 and 2 feet above the net.
- [ ] Choose the force slider's minimum and maximum travel times.
- [ ] Decide whether to display force only or force plus estimated travel time.
- [ ] Define the exact setter and endpoint drag boundaries.
- [ ] Choose the setter's visual representation.

### Technical scope

- [x] Write the technical implementation plan.
- [ ] Review and accept the technical implementation plan.
- [x] Choose Three.js as the 3D rendering dependency.
- [x] Pin the exact Three.js version when implementation begins.
- [x] Define the scene coordinate system and attacking-team orientation.
- [x] Define the centralized calibration configuration.
- [x] Define the canonical client-side state and animation state machine.
- [x] Define URL parsing, validation, clamping, serialization, and clearing.
- [x] Define curve construction and invalid-geometry handling.
- [x] Define pointer ownership for objects, camera controls, and the mobile
  control sheet.
- [x] Define phone, desktop, full-screen, and resize behavior.
- [x] Define the authenticated Flask route, template, bundle, and navigation
  integration.
- [x] Define the verification and browser-test strategy.

### Interaction proof of concept

- [ ] Render a regulation-scale half court, net, setter, ball, target, and path.
- [ ] Validate the numbered target coordinates visually.
- [ ] Validate the setter-relative position 6 behavior.
- [ ] Validate the three height curves at short, long, front, and back targets.
- [ ] Validate force-based travel speed.
- [ ] Validate play, pause, resume, completion, editing, and reset behavior.
- [ ] Validate setter dragging, endpoint dragging, orbit, and zoom with a mouse.
- [ ] Validate gesture ownership and handle sizes on a physical phone.
- [ ] Calibrate setter location, release height, contact height, and force range.
- [ ] Review the prototype from every named camera view.
- [ ] Decide whether the prototype interaction is ready for FilmZone integration.

### FilmZone implementation

- [x] Add the authenticated feature route and template.
- [x] Add the bundled 3D dependency and feature JavaScript entry point.
- [x] Implement the regulation-scale scene and responsive renderer lifecycle.
- [x] Implement setter height, orientation, dragging, and release-point behavior.
- [x] Implement standard targets and custom target dragging.
- [x] Implement trajectory construction and preview rendering.
- [x] Implement force-based animation with play, pause, resume, and reset.
- [x] Implement named camera views, orbit, zoom, camera reset, and full screen.
- [x] Implement phone controls and the collapsible control sheet.
- [x] Implement desktop and large-screen presentation controls.
- [x] Implement generated set labels and adjusted/custom status.
- [x] Implement validated share-link generation and loading.
- [x] Remove loaded query parameters after the first shared-state edit.
- [x] Add the FilmZone navigation and dashboard entries.
- [x] Add basic WebGL fallback handling.
- [x] Rebuild generated frontend assets through Docker Compose.

### Verification and release

- [x] Add focused browser coverage for state, controls, URL sharing, and resets.
- [ ] Expand the Playwright suite into interactive coverage for pointer dragging,
  camera controls, animation interruption/replay, and responsive control state.
- [ ] Add deterministic Playwright assertions for position 6 following setter
  movement and force changing duration without changing trajectory geometry.
- [ ] Test the supported phone viewport with touch-equivalent interactions.
- [ ] Test the supported desktop viewport and full-screen presentation.
- [ ] Verify that opening and closing mobile controls preserves scene framing.
- [ ] Verify rapid edits and repeated playback do not create overlapping
  animations or stale state.
- [ ] Verify invalid and extreme URL values are safely ignored or clamped.
- [ ] Verify light theme, dark theme, reduced motion, and WebGL fallback.
- [ ] Review deliberate visual-regression screenshot changes.
- [ ] Test on a representative physical phone and the intended review display.
- [ ] Run a coaching calibration session and record resulting value changes.
- [ ] Confirm every first-release acceptance criterion below.
- [ ] Update this specification to reflect the shipped behavior.

## Summary

Set Explorer is an interactive 3D teaching tool that helps players learn what
different volleyball sets should look like. It visualizes the path of a ball
from a movable setter to an intended hitter contact point and lets the user
explore how court position, set height, target tightness, and travel speed
affect the result.

The feature complements FilmZone's existing whiteboard. The whiteboard remains
the tool for rotations, players, and blocking schemes; Set Explorer is focused
only on the setter, ball, net, target, and ball trajectory.

## Goals

- Help players recognize the expected shape and destination of common sets.
- Reinforce the team's numbered vocabulary for set position and height.
- Let a coach demonstrate sets on a large screen during team review.
- Give players a touch-friendly way to explore the same sets on phones.
- Make a configuration shareable through a URL.

## Non-goals for the first release

- Simulating rotations, blockers, defenders, hitters, or attack outcomes.
- Replacing the existing whiteboard or adding freehand drawing.
- Modelling ball flight with a physics engine.
- Claiming biomechanical or ball-tracking measurement accuracy.
- Linking trajectories to game film or game statistics.
- Saving team presets in the database.
- Supporting collaborative or simultaneous editing.

## Users and environments

### Player

Players primarily use Set Explorer on a phone. They need large touch targets,
simple controls, reliable replay, and an easy way to recover the default view.

### Coach

The coach primarily uses Set Explorer on a large screen during team review.
The coach needs visible measurements, rapid switching between configurations,
named camera views, full-screen presentation, and repeatable animation.

## Coaching vocabulary

A set is defined by separate position and height values. The interface may
display the combined name, such as `31`, as a summary, but it must not require
a separately authored preset for every two-digit combination.

### Court positions

Positions run from left to right along the net from the attacking team's point
of view. They retain this meaning from every camera angle and do not reverse or
renumber when viewed from the opposition's side.

| Position | Intended location |
| ---: | --- |
| 1 | Left side |
| 3 | Between the left side and middle |
| 5 | Middle |
| 6 | Approximately 2.5 feet behind the setter |
| 7 | Between the middle and right side |
| 9 | Right side |

Positions 1, 3, 5, 7, and 9 are derived from the court width. Divide the width
into nine equal lanes and place each target at the centre of its numbered lane.
Using an origin at the attacking team's left sideline, the lateral coordinate
is:

```text
x = (position - 0.5) * (court width / 9)
```

On a 9-metre-wide court, this places positions 1, 3, 5, 7, and 9 at 0.5, 2.5,
4.5, 6.5, and 8.5 metres. The half-lane offset keeps the outside targets a
reasonable distance inside the sidelines.

Position 6 is special: it is always approximately 2.5 feet (0.762 metres)
behind the setter in the back-set direction, toward the attacking team's right
side, rather than fixed to the court. Its lateral coordinate follows the
setter, and this direction follows the attacking team's court orientation
rather than the camera. The setter may still rotate to face the resulting
target for visualization.

Selecting position 6 establishes this dynamic relationship. If the user then
manually drags the endpoint, the endpoint becomes custom and stops following
the setter. Selecting or snapping to position 6 again restores the dynamic
relationship.

### Set heights

Height identifies the approximate upward angle of the ball as it leaves the
setter's release point.

| Height | Approximate initial angle |
| ---: | ---: |
| 1 | 45 degrees |
| 2 | 52 degrees |
| 3 | 60 degrees |

These angles are coaching definitions used to construct a consistent visual
curve. They are not the output of a physics calculation.

### Contact point

The net is 7 feet 11.75 inches tall (approximately 2.432 metres). This is the
reference height for the endpoint and all net-clearance calculations.

The endpoint represents the intended hitter contact point, not where the ball
would land. Its initial vertical position is fixed approximately 1.5 to 2 feet
(0.46 to 0.61 metres) above the net. The proposed default is 1.75 feet
(approximately 0.53 metres) above the net.

Users may move the contact point left or right and tight to or away from the
net. They may not move it vertically in the first release. Vertical adjustment
can be reconsidered as an advanced coach control after the core interaction is
validated.

## Scene contents

The 3D scene contains only the objects necessary to understand the set:

- A regulation-scale half court with readable boundary and attack lines.
- A net, tape, and antennas.
- A single movable setter representation.
- A volleyball whose release point is anchored near the setter's forehead or
  hands.
- A visible contact-point handle.
- A trajectory guide that previews the current path.
- Optional unobtrusive markers for positions 1, 3, 5, 6, 7, and 9.

The scene should prioritize legibility and smooth performance over decorative
detail, particularly on lower-powered phones.

The setter rotates horizontally to face the current target whenever the setter
or target moves. All sets, including back sets, originate from the same stable
release point above the setter's forehead. Its vertical coordinate is derived
from the configured setter height plus a calibrated release offset. The release
point does not shift behind the setter for a back set.

The setter starts close to and in front of the net with its lateral position at
lane 6 of the same nine-lane court-width grid. On a 9-metre court, the centre of
lane 6 is `5.5 m` from the attacking team's left sideline. Its default distance
from the net is 2 feet (approximately 0.610 metres) into the attacking court.
This starting lane is distinct from target position 6, which remains a special
setter-relative back set.

Setter height is configurable from 5 feet 2 inches through 6 feet 4 inches
(approximately 1.575 through 1.930 metres). The initially selected height is 5
feet 10 inches (approximately 1.778 metres), providing a neutral starting point
without preventing immediate adjustment for a specific player. The release
offset above the forehead remains a calibration decision.

## Set state model

A rendered set is determined by these independent values:

| Value | Purpose |
| --- | --- |
| Setter position | Establishes the trajectory origin on the court plane |
| Setter height | Scales the setter and establishes the forehead height |
| Target position | Selects a standard destination along the net |
| Custom target coordinates | Records fine adjustment left/right and tight/off the net |
| Height level | Selects the approximate initial angle and curve shape |
| Force | Controls travel speed without changing the path |
| Contact height | Establishes the fixed endpoint height above the net |
| Camera view | Selects the intended teaching perspective |

Changing force must not change the setter position, endpoint, contact height,
or trajectory geometry. It changes only the time the ball takes to travel the
existing path.

## Trajectory model

The trajectory should be a deterministic parametric curve rather than a
physics simulation. A curve with independent control over the release tangent
and endpoint is preferred so that it can:

- Leave the setter at the approximate angle associated with height 1, 2, or 3.
- Terminate at the exact intended hitter contact point.
- Remain stable when replayed.
- Update immediately when either handle or a control changes.
- Animate consistently at different force values.

The same complete state must always produce the same path and animation.
Displayed timing should be described as estimated unless it is later
calibrated against measured footage.

## Controls

### Primary controls

- **Position:** Select 1, 3, 5, 6, 7, or 9.
- **Height:** Select 1, 2, or 3.
- **Force:** Use a continuous slider that controls travel time.
- **Setter height:** Adjust the setter model and release-point height while
  preserving its floor position.
- **Play/pause:** Start or pause the ball at any point on its path. Playing
  after completion begins the set again from the release point.
- **Reset set:** Restore the selected configuration to its defaults.
- **Reset camera:** Restore the current named camera view.

### Direct manipulation

- Dragging the setter moves it left/right and toward/away from the net on the
  court plane.
- Dragging the contact point moves it left/right and tight/off the net.
- Dragging elsewhere in the scene rotates the camera.
- Pinching on touch devices or scrolling with a mouse zooms the camera.
- Camera rotation is temporarily disabled while the setter or contact point is
  being dragged.
- Setter and contact-point handles require touch targets larger than their
  visible geometry.
- A visible floor ring beneath the setter is its primary drag handle. Tapping
  the setter selects and emphasizes that ring; dragging the model itself does
  not need to initiate movement.
- Tapping the endpoint selects and emphasizes its handle. Setter and endpoint
  selection use visually distinct handles.
- Tapping or dragging empty scene space clears object selection and controls
  the camera.
- Object movement uses one pointer only. If a second pointer appears, object
  movement is cancelled and the gesture becomes camera zoom.
- Dragging an object projects movement onto an invisible horizontal court
  plane. The setter's feet remain on the floor and the endpoint retains its
  configured contact height from every camera angle.

Selecting a numbered position moves the contact point to its calibrated
default. After manual adjustment, the nearest standard position may remain
highlighted, but the interface must indicate that the endpoint is customized.
A snap or reset action returns it to the exact standard location.

An adjustment within a defined tolerance of a numbered position is labelled,
for example, `31 · adjusted`. Outside that tolerance, the label becomes
`Custom · Height 1`. Selecting a numbered position restores its precise target.

### Animation behavior

- Before playback, the ball rests at the setter's release point.
- Play starts or resumes the animation; pause freezes the ball at any point.
- At completion, the ball remains briefly at the contact point.
- Playing after completion returns the ball to the release point and starts a
  new animation.
- Changing position, height, force, setter location, or endpoint location
  cancels playback, returns the ball to the updated release point, and redraws
  the path immediately.
- Moving the camera does not interrupt playback.
- Reset stops playback and returns the ball to the release point.
- When the page becomes hidden, playback pauses instead of advancing in the
  background.

### Movement and curve boundaries

- The setter cannot cross the net and remains within the team's court or an
  explicitly allowed portion of the surrounding free zone.
- The endpoint remains within the antennas and on the valid attacking side of
  the net unless a future out-of-system mode deliberately expands that range.
- Setter and endpoint positions are clamped before curve construction.
- Extremely short, reversed, or otherwise degenerate configurations are
  clamped to the nearest usable configuration rather than producing a broken
  curve.
- The generated curve must not dip below its valid path, produce an excessive
  apex, or unintentionally intersect the net.
- Selected objects and their handles remain inside the usable camera framing,
  including when the phone control sheet changes size.

## Camera views

Named views provide consistent teaching perspectives while preserving free
orbit and zoom after selection:

- End court
- Left-side angle
- Middle angle
- Right-side angle
- Opposition angle

The feature should also offer reset-camera and full-screen actions. Camera
transitions should be brief and smooth rather than instantaneous or prolonged.

## Responsive experience

### Phone

- The scene occupies most of the available screen.
- Position and height use large buttons or segmented controls.
- Secondary controls appear in a collapsible bottom sheet.
- Play/pause and reset remain readily accessible.
- Controls account for device safe areas and portrait orientation.
- Endpoint and setter dragging must not be confused with scene rotation.
- The user can always recover with reset-set and reset-camera actions.
- The bottom sheet consumes pointer gestures that begin inside it rather than
  passing them through to the 3D scene.
- Opening or closing the sheet keeps important scene objects within the visible
  portion of the viewport.

Landscape phone use should remain functional but is not required to have a
distinctly optimized layout in the first release.

### Large screen

- The scene and controls can appear side by side.
- Current position, height, force, and estimated travel time remain visible.
- Preset camera views are available without opening a compact menu.
- Full-screen presentation is supported.

## Generated set label

The interface should reinforce team vocabulary by showing the combination of
position and height. For example:

```text
Set 31
Position 3 · Height 1 · Force 65%
```

If a user moves the endpoint away from the calibrated position, the interface
should mark the set as adjusted or custom while retaining the closest useful
coaching label.

## URL sharing

The first release should support sharing the current configuration without
server persistence. The URL state includes:

- Setter court coordinates.
- Setter height.
- Selected target position.
- Custom target coordinates or offsets.
- Height level.
- Force.
- Named camera view.

Freely orbited camera coordinates do not need to be shared initially. A named
view gives the recipient a stable intended perspective and keeps URLs compact.

A **Copy share link** action generates the URL and copies it to the clipboard.
On load, all URL values must be parsed defensively, restricted to known values,
and clamped to safe court and control ranges. Missing or invalid values fall
back to defaults. Shared links must not contain executable data or bypass the
normal FilmZone authentication requirement.

Query parameters represent the shared starting state. They remain in the
address while that state is unchanged. As soon as the user changes any shared
set value or selects a different named camera view, the application removes
the query parameters from the visible URL without navigating or reloading.
Playback, pause, and free camera orbit do not clear them because those actions
do not change shared state. The **Copy share link** action always builds a fresh
URL from the current state.

Shared URLs do not require a schema-version parameter. Compatibility with old
links is not guaranteed when the state format changes.

## Basic usability and fallback behavior

- All controls have visible labels.
- Selected position, height, and camera controls do not rely on color alone.
- Animation respects reduced-motion preferences where practical; the user can
  still inspect the static trajectory.
- Text and controls meet the contrast expectations of FilmZone's supported
  themes.
- If WebGL is unavailable, the page provides an understandable message and
  retains navigation back to FilmZone.

## Proposed delivery sequence

### Phase 1: Coaching calibration and wireframes

- Validate the calculated court coordinates for positions 1, 3, 5, 7, and 9.
- Validate position 6 at 2.5 feet behind the setter.
- Validate the net at 7 feet 11.75 inches high.
- Validate the setter's default distance of 2 feet from the net.
- Validate the 5-foot-10-inch default setter height and calibrate the release
  offset above the forehead.
- Confirm the default contact height.
- Calibrate force values to useful estimated travel times.
- Define valid setter and endpoint movement boundaries and curve limits.
- Produce phone and large-screen wireframes.

### Phase 2: Interaction proof of concept

- Render the minimal regulation-scale scene.
- Validate orbit, zoom, setter dragging, and endpoint dragging.
- Validate the curve at all positions and heights.
- Validate force-based travel speed and play/pause behavior.
- Test touch interactions on a physical phone before full integration.

The proof of concept may be disposable. Its purpose is to validate interaction
and coaching usefulness, not establish the final application structure.

### Phase 3: FilmZone frontend release

- Add an authenticated Set Explorer page and navigation entry.
- Bundle the 3D dependency through FilmZone's frontend build.
- Implement the responsive phone and large-screen layouts.
- Implement numbered positions, heights, force, animation, camera views, and
  reset actions.
- Implement validated URL state and copy-share-link behavior.
- Provide basic usability and fallback behavior.

This phase remains frontend-only apart from the authenticated Flask route and
Jinja page used to deliver the feature. It requires no new database tables or
JSON endpoints.

### Phase 4: Calibration and verification

- Verify the supported mobile and desktop browser dimensions.
- Verify touch, mouse, light theme, dark theme, and reduced motion.
- Review performance on a representative lower-powered phone.
- Conduct a team-review trial on the intended large display.
- Ask players to identify visualized sets without seeing the set label.
- Adjust coordinates, angles, timing, and camera views based on coaching use.

## First-release acceptance criteria

- An authenticated player can use the explorer comfortably at the project's
  supported phone viewport.
- A coach can present the explorer clearly at the project's supported desktop
  viewport and in full screen.
- The setter and contact point can be moved reliably with touch or mouse.
- The endpoint stays at the configured contact height while being dragged.
- Selecting a standard position returns the endpoint to its calibrated target.
- Heights 1, 2, and 3 produce visibly distinct and repeatable trajectories.
- Changing force changes travel time and does not change trajectory geometry.
- Playback can be paused and resumed at any point.
- Editing a set during playback cancels playback and returns the ball to its
  updated release point.
- All five named camera views are available and reset correctly.
- A copied share link reconstructs the same meaningful set state.
- Editing a loaded shared state removes its query parameters without reloading.
- Invalid URL state is ignored or safely clamped.
- Reset actions always return the user to a usable set and camera state.
- The scene remains legible and interactive on phone and large-screen layouts.
- Existing FilmZone navigation, authentication, and features remain unaffected.

## Open coaching decisions

These decisions should be resolved before implementation or during the
calibration prototype:

1. What is the default selected setter height within the 5-foot-2-inch to
   6-foot-4-inch range?
2. How far above the forehead should the release point be?
3. Should the default contact point be 1.5, 1.75, or 2 feet above the net?
4. What travel-time range should the force slider represent?
5. Should the force control display only a percentage, or percentage plus
   estimated seconds?
6. How far may the setter and target be dragged before being clamped?
7. Should the setter be represented by a simple coaching marker, a stylized
   figure, or a more realistic player model?

## Future possibilities

Ideas intentionally deferred until the core teaching tool proves useful:

- Compare two trajectories in the same scene.
- Hide the label and ask a player to identify the set.
- Add a hitter contact silhouette without simulating a full attack.
- Calibrate set timing against selected video clips.
